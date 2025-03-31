import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import mealPlanController from '@/controllers/mealPlan.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';

const router = Router();

router.use(validateAccessToken);

// TODO: NOT YET CREATE MIDDLEWARE HANDLE PARAMS AND BODY VALUE
router.get(ROUTES.MEALPLAN.GET, mealPlanController.getMealPlan);
router.post(ROUTES.MEALPLAN.ADD, mealPlanController.addFoodToMealPlan);
router.put(ROUTES.MEALPLAN.EDIT, mealPlanController.editDayMealPlan);
router.delete(
  ROUTES.MEALPLAN.DELETE,
  mealPlanController.removeFoodFromMealPlan,
);

export default router;
