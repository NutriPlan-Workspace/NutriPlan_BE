import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import foodController from '@/controllers/food.controller';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import { validateSearchFood } from '@/middlewares/validateQuery.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { FoodFilterSchema } from '@/schemas/foodFilter.schema';

const router = Router();

router.get(
  ROUTES.FOOD.GETLIST,
  validateSchema(FoodFilterSchema, 'query'),
  foodController.getListFood,
);
router.get(ROUTES.FOOD.SEARCH, validateSearchFood, foodController.searchFood);
router.get(ROUTES.FOOD.GET_BY_ID, validateObjectId, foodController.getFoodByID);

export default router;
