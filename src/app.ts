import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { json } from 'express';

import connectDB from '@/configs/database.config';
import { ALLOWED_ORIGINS, PORT } from '@/configs/secrets';
import { swaggerSpec, swaggerUi } from '@/configs/swagger.config';
import { ROUTES } from '@/constants/routes';
import Routes from '@/routes/index';

const app = express();

connectDB();

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(json());
app.use(cookieParser());

app.use(ROUTES.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(ROUTES.ROOT.PATH, Routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
