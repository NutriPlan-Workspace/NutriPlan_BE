import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import mealPlanController from '@/controllers/mealPlan.controller';

const router = Router();

router.get(ROUTES.MEALPLAN.GETALL, mealPlanController.getAllMealPlan);
router.get(ROUTES.MEALPLAN.GETBYDATE, mealPlanController.getMealPlanByDate);
router.get(ROUTES.MEALPLAN.GETBYWEEK, mealPlanController.getMealPlanByWeek);
router.get(ROUTES.MEALPLAN.GETBYRANGE, mealPlanController.getMealPlanByRange);
router.put(ROUTES.MEALPLAN.EDIT, mealPlanController.editDayMealPlan);
router.post(ROUTES.MEALPLAN.ADD, mealPlanController.addFoodToMealPlan);
router.delete(
  ROUTES.MEALPLAN.DELETE,
  mealPlanController.removeFoodFromMealPlan,
);

export default router;
