import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user (only admin can create admin users)
    const userRole = req.user?.role === 'admin' && role === 'admin' ? UserRole.ADMIN : UserRole.USER;
    
    const user = userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: userRole,
    });

    await userRepository.save(user);

    // Generate token
    const token = generateToken({
      userId: user.id as any,
      email: user.email,
      role: user.role as any,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔐 Login attempt started');
    const { email, password } = req.body;
    console.log('📧 Email received:', email);
    console.log('🔑 Password received:', password ? `${password.substring(0, 3)}***` : 'NO PASSWORD');

    // Find user by email
    console.log('🔍 Searching user in database...');
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });

    // Compare password
    console.log('🔐 Comparing passwords...');
    console.log('Password from DB (hashed):', user.password.substring(0, 20) + '...');
    console.log('Password from request:', password);
    
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('🔐 Password valid?', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for user:', email);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    console.log('✅ Password validated successfully');

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);
    console.log('✅ Last login updated');

    // Generate token
    console.log('🎟️ Generating JWT token...');
    const token = generateToken({
      userId: user.id as any,
      email: user.email,
      role: user.role as any,
    });
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    console.log('✅ Login successful for:', email);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
    });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const { name, password } = req.body;
    
    const user = await userRepository.findOne({
      where: { id: req.user.userId as any },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Update fields
    if (name) {
      user.name = name;
    }
    
    if (password) {
      user.password = await hashPassword(password);
    }

    await userRepository.save(user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
}
