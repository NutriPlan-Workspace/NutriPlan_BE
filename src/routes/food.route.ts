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
/**
 * @swagger
 * /foods/search:
 *   get:
 *     summary: Search foods
 *     tags: [Foods]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 * */
router.get(ROUTES.FOOD.SEARCH, validateSearchFood, foodController.searchFood);

/**
 * @swagger
 * /foods/{id}:
 *   get:
 *     summary: Get food by ID
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Food details
 * */
router.get(ROUTES.FOOD.GET_BY_ID, validateObjectId, foodController.getFoodByID);

router.use(validateAccessToken);

/**
 * @swagger
 * /foods:
 *   post:
 *     summary: Create custom food/recipe
 *     tags: [Foods]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Food created
 * */
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
