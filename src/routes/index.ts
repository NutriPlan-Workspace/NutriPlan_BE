import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import authRoutes from '@/routes/auth.route';

const router = Router();

router.use(ROUTES.AUTH.PATH, authRoutes);

export default router;
