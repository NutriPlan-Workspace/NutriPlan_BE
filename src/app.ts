import cors from 'cors';
import express, { json } from 'express';

import connectDB from '@/configs/database';
import { PORT } from '@/configs/secrets';
import { swaggerSpec, swaggerUi } from '@/configs/swagger';
import { ROUTES } from '@/constants/routes';
import AuthRouter from '@/routes/auth.route';

const app = express();

connectDB();
app.use(cors());

app.use(json());
app.use(ROUTES.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(ROUTES.AUTH.PATH, AuthRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
