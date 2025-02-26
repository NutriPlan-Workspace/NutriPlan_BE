import cors from 'cors';
import dotenv from 'dotenv';
import express, { json, Request, Response } from 'express';

import connectDB from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(cors());
app.use(json());

// route
app.get('/', (req: Request, res: Response) => {
  res.send('hello from backend server');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
