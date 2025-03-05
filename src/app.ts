import cors from 'cors';
import express, { json } from 'express';

import connectDB from '@/configs/database';
import { env } from '@/configs/env';
import { swaggerSpec, swaggerUi } from '@/configs/swagger';

const app = express();
const PORT = env.PORT;

connectDB();

app.use(cors());
app.use(json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
