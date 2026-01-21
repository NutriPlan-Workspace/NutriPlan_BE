import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import analyticsController from '@/controllers/analytics.controller';
import {
  isAdmin,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';

const router = Router();

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

router.get(
  ROUTES.ANALYTICS.ADMIN_DASHBOARD,
  validateAccessToken,
  isAdmin,
  analyticsController.getDashboardStats,
);

export default router;
