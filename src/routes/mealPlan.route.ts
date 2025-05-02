import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import mealPlanController from '@/controllers/mealPlan.controller';
import {
  parseUserIfExists,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';
import { validateMealPlanDateRange } from '@/middlewares/validateMealPlan.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { autoGenerateMealPlanSchema } from '@/schemas/mealPlan.schema';

const router = Router();

router.post(
  ROUTES.MEALPLAN.AUTO_GENERATE,
  parseUserIfExists,
  validateSchema(autoGenerateMealPlanSchema),
  mealPlanController.autoGenerateMealPlan,
);

router.use(validateAccessToken);

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
