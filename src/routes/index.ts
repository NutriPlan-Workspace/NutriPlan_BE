import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import aiRoutes from '@/routes/ai.route';
import analyticsRoutes from '@/routes/analytics.route';
import articleRoutes from '@/routes/article.route';
import authRoutes from '@/routes/auth.route';
import categoryRoutes from '@/routes/category.route';
import collectionRoutes from '@/routes/collection.route';
import foodRoutes from '@/routes/food.route';
import mealPlanRoutes from '@/routes/mealPlan.route';
import pantryRoutes from '@/routes/pantry.route';
import userRoutes from '@/routes/user.route';

const router = Router();

router.use(ROUTES.AUTH.PATH, authRoutes);
router.use(ROUTES.AI.PATH, aiRoutes);
router.use(ROUTES.MEALPLAN.PATH, mealPlanRoutes);
router.use(ROUTES.USER.PATH, userRoutes);
router.use(ROUTES.COLLECTION.PATH, collectionRoutes);
router.use(ROUTES.FOOD.PATH, foodRoutes);
router.use(ROUTES.CATEGORY.PATH, categoryRoutes);
router.use(ROUTES.ARTICLES.PATH, articleRoutes);
router.use(ROUTES.ANALYTICS.PATH, analyticsRoutes);
router.use(ROUTES.PANTRY.PATH, pantryRoutes);

export default router;
