import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import authRoutes from '@/routes/auth.route';
import mealPlanRoutes from '@/routes/mealPlan.route';
import userRoutes from '@/routes/user.route';

const router = Router();

router.use(ROUTES.AUTH.PATH, authRoutes);
router.use(ROUTES.MEALPLAN.PATH, mealPlanRoutes);
router.use(ROUTES.USER.PATH, userRoutes);

export default router;
