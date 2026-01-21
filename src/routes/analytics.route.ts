import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import analyticsController from '@/controllers/analytics.controller';
import {
  isAdmin,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';

const router = Router();

/**
 * @swagger
 * /analytics/food-view:
 *   post:
 *     summary: Track food view
 *     tags: [Analytics]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodId:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: View tracked
 * */
router.post(ROUTES.ANALYTICS.FOOD_VIEW, analyticsController.trackFoodView);
router.post(
  ROUTES.ANALYTICS.ARTICLE_VIEW,
  analyticsController.trackArticleView,
);
router.post(
  ROUTES.ANALYTICS.CURATED_COLLECTION_VIEW,
  analyticsController.trackCuratedCollectionView,
);
router.post(
  ROUTES.ANALYTICS.CURATED_COLLECTION_COPY,
  analyticsController.trackCuratedCollectionCopy,
);

/**
 * @swagger
 * /analytics/admin/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 * */
router.get(
  ROUTES.ANALYTICS.ADMIN_DASHBOARD,
  validateAccessToken,
  isAdmin,
  analyticsController.getDashboardStats,
);

export default router;
