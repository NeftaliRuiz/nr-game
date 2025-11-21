import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { Event } from '../entities/Event';
import { Game } from '../entities/Game';
import { GameParticipant } from '../entities/GameParticipant';
import { Question } from '../entities/Question';
import { Answer } from '../entities/Answer';
import { Team } from '../entities/Team';

dotenv.config();

// Parse DATABASE_URL if provided (for Railway, Render, Heroku, etc.)
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Use DATABASE_URL directly
    return {
      type: 'postgres' as const,
      url: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
  
  // Fallback to individual environment variables (local development)
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'trivia_user',
    password: process.env.DB_PASSWORD || 'trivia_pass',
    database: process.env.DB_DATABASE || 'trivia_db',
  };
};

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  synchronize: true, // Auto-create tables (use migrations for production later)
  logging: !isProduction,
  entities: [User, Event, Game, GameParticipant, Question, Answer, Team],
  migrations: isProduction ? ['dist/migrations/**/*.js'] : ['src/migrations/**/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};
