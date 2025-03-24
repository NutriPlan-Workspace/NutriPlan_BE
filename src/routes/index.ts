import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import authRoutes from '@/routes/auth.route';
import mealPlanRoutes from '@/routes/mealPlan.route';

const router = Router();

router.use(ROUTES.AUTH.PATH, authRoutes);
router.use(ROUTES.MEALPLAN.PATH, mealPlanRoutes);

export default router;
