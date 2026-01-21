import dotenv from 'dotenv';

dotenv.config();

export const PORT: number = Number(process.env.PORT) || 3000;
export const DATABASE_URL: string = process.env.MONGO_URI || '';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'default_secret';
export const ACCESS_SECRET: string =
  process.env.ACCESS_TOKEN_SECRET || 'default_access_secret';
export const REFRESH_SECRET: string =
  process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';
export const ACCESS_EXPIRES_IN = '15m';
export const REFRESH_EXPIRES_IN = '7d';
export const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS) || 10;
export const SERVER_URL = `http://localhost:${PORT}/api`;
export const ALLOWED_ORIGINS: string[] = [
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];
export const GITHUB_TOKEN: string = process.env.GITHUB_TOKEN || '';
export const GITHUB_AI_ENDPOINT: string =
  process.env.GITHUB_AI_ENDPOINT || 'https://models.github.ai/inference';
export const GITHUB_AI_MODEL: string =
  process.env.GITHUB_AI_MODEL || 'openai/gpt-4.1';
