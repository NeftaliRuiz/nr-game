import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string; // UUID
  email: string;
  role: 'admin' | 'user';
}

/**
 * Generate a JWT token for a user
 * @param payload - User information to encode in token
 * @returns JWT token string
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh a JWT token (generate new token with same payload)
 * @param token - Current JWT token
 * @returns New JWT token or null if current token is invalid
 */
export function refreshToken(token: string): string | null {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  return generateToken(payload);
}
