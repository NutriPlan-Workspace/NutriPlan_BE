import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import mealPlanController from '@/controllers/mealPlan.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import { validateMealPlanDateRange } from '@/middlewares/validateMealPlan.middleware';

const router = Router();

router.use(validateAccessToken);

// TODO: NOT YET CREATE MIDDLEWARE HANDLE PARAMS AND BODY VALUE
router.get(ROUTES.MEALPLAN.GET, mealPlanController.getMealPlan);
router.get(ROUTES.MEALPLAN.GET_LATEST, mealPlanController.getLatestMealPlan);
router.get(
  ROUTES.MEALPLAN.GET_GROCERIES,
  validateMealPlanDateRange,
  mealPlanController.getGroceries,
);
router.post(ROUTES.MEALPLAN.ADD, mealPlanController.addFoodToMealPlan);
router.put(ROUTES.MEALPLAN.EDIT, mealPlanController.editDayMealPlan);
router.delete(
  ROUTES.MEALPLAN.DELETE,
  mealPlanController.removeFoodFromMealPlan,
);

export default router;
