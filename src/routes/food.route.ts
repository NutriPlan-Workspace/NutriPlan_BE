import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import foodController from '@/controllers/food.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import { validateSearchFood } from '@/middlewares/validateQuery.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { FoodSchema, FoodUpdateSchema } from '@/schemas/food.schema';
import { FoodFilterSchema } from '@/schemas/foodFilter.schema';

const router = Router();

router.get(
  ROUTES.FOOD.GETLIST,
  validateSchema(FoodFilterSchema, 'query'),
  foodController.getListFood,
);
router.get(ROUTES.FOOD.SEARCH, validateSearchFood, foodController.searchFood);
router.get(ROUTES.FOOD.GET_BY_ID, validateObjectId, foodController.getFoodByID);

router.use(validateAccessToken);

router.post(
  ROUTES.FOOD.CREATE,
  validateSchema(FoodSchema),
  foodController.createFood,
);
router.put(
  ROUTES.FOOD.UPDATE,
  validateObjectId,
  validateSchema(FoodUpdateSchema),
  foodController.updateFood,
);
router.delete(ROUTES.FOOD.DELETE, validateObjectId, foodController.deleteFood);

export default router;
