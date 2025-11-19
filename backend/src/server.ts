import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeGameSocket, getActiveGameRooms } from './socket/game-socket';

// Import routes
import triviaRoutes from './routes/trivia.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import eventRoutes from './routes/event.routes';
import gameRoutes from './routes/game.routes';
import teamRoutes from './routes/team.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration for local network
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Routes
app.use('/api/trivia', triviaRoutes); // Legacy routes (V1)
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/admin', adminRoutes); // Admin panel routes
app.use('/api/events', eventRoutes); // Event management routes
app.use('/api/teams', teamRoutes); // Team management routes
app.use('/api/game', gameRoutes); // Game routes (Kahoot & Geoparty)

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Trivia API is running',
    version: '2.0.0',
    database: 'PostgreSQL with TypeORM',
    websocket: 'Socket.IO enabled'
  });
});

// Active game rooms endpoint (for monitoring)
app.get('/api/game/rooms', (req: Request, res: Response) => {
  const rooms = getActiveGameRooms();
  res.json({
    success: true,
    data: {
      totalRooms: rooms.length,
      rooms,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await initializeDatabase();
    console.log('✅ Database connected successfully');

    // Initialize Socket.IO
    const io = initializeGameSocket(httpServer);
    console.log('✅ Socket.IO initialized');

    // Start server - Listen on all network interfaces
    const localIP = '10.45.3.141';
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Network: http://${localIP}:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - http://${localIP}:${PORT}/api/auth (Authentication)`);
      console.log(`   - http://${localIP}:${PORT}/api/admin (Admin Panel)`);
      console.log(`   - http://${localIP}:${PORT}/api/events (Events)`);
      console.log(`   - http://${localIP}:${PORT}/api/game (Game - Kahoot & Geoparty)`);
      console.log(`   - http://${localIP}:${PORT}/api/trivia (Legacy V1)`);
      console.log(`\n🎮 WebSocket:`);
      console.log(`   - ws://${localIP}:${PORT}/game (Real-time game events)`);
      console.log(`\n💡 Use the seed script to populate initial data:`);
      console.log(`   npm run seed`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
