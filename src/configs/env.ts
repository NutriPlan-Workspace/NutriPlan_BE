import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '5000',
  SERVER_URL: `http://localhost:${process.env.PORT || '5000'}/api`,
};
