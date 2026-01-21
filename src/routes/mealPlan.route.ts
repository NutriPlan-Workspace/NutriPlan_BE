import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import mealPlanController from '@/controllers/mealPlan.controller';
import {
  isAdmin,
  parseUserIfExists,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';
import { validateMealPlanDateRange } from '@/middlewares/validateMealPlan.middleware';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  adminMealPlanCreateSchema,
  adminMealPlanListQuerySchema,
  adminMealPlanUpdateSchema,
  autoGenerateMealPlanSchema,
  mealPlanSwapApplySchema,
  mealPlanSwapOptionsSchema,
} from '@/schemas/mealPlan.schema';

const router = Router();

/**
 * @swagger
 * /planner/auto-generate:
 *   post:
 *     summary: Auto-generate daily meal plan
 *     tags: [MealPlan]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Meal plan generated
 * */
router.post(
  ROUTES.MEALPLAN.AUTO_GENERATE,
  parseUserIfExists,
  validateSchema(autoGenerateMealPlanSchema),
  mealPlanController.autoGenerateMealPlan,
);

router.post(
  ROUTES.MEALPLAN.AUTO_GENERATE_WEEK,
  parseUserIfExists,
  validateSchema(autoGenerateMealPlanSchema),
  mealPlanController.autoGenerateMealPlanWeek,
);

router.use(validateAccessToken);

router.get(
  ROUTES.MEALPLAN.ADMIN_LIST,
  isAdmin,
  validateSchema(adminMealPlanListQuerySchema, 'query'),
  mealPlanController.adminListMealPlans,
);
router.post(
  ROUTES.MEALPLAN.ADMIN_CREATE,
  isAdmin,
  validateSchema(adminMealPlanCreateSchema),
  mealPlanController.adminCreateMealPlan,
);
router.put(
  ROUTES.MEALPLAN.ADMIN_UPDATE,
  isAdmin,
  validateObjectId,
  validateSchema(adminMealPlanUpdateSchema),
  mealPlanController.adminUpdateMealPlan,
);
router.delete(
  ROUTES.MEALPLAN.ADMIN_DELETE,
  isAdmin,
  validateObjectId,
  mealPlanController.adminDeleteMealPlan,
);

/**
 * @swagger
 * /planner:
 *   get:
 *     summary: Get meal plan
 *     tags: [MealPlan]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: week
 *         schema:
 *           type: boolean
 *         description: Get weekly plan
 *     responses:
 *       200:
 *         description: Meal plan retrieved
 * */
router.get(ROUTES.MEALPLAN.GET, mealPlanController.getMealPlan);
router.get(ROUTES.MEALPLAN.GET_LATEST, mealPlanController.getLatestMealPlan);
/**
 * @swagger
 * /planner/groceries:
 *   get:
 *     summary: Get grocery list
 *     tags: [MealPlan]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Grocery list retrieved
 * */
router.get(
  ROUTES.MEALPLAN.GET_GROCERIES,
  validateMealPlanDateRange,
  mealPlanController.getGroceries,
);

/**
 * @swagger
 * /planner:
 *   post:
 *     summary: Add food to meal plan
 *     tags: [MealPlan]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mealDate, mealType, foodId]
 *             properties:
 *               mealDate:
 *                 type: string
 *                 format: date
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               foodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Food added to meal plan
 * */
router.post(ROUTES.MEALPLAN.ADD, mealPlanController.addFoodToMealPlan);

router.put(ROUTES.MEALPLAN.EDIT, mealPlanController.editDayMealPlan);
router.delete(
  ROUTES.MEALPLAN.DELETE,
  mealPlanController.removeFoodFromMealPlan,
);
/**
 * @swagger
 * /planner/{id}/swap-options:
 *   post:
 *     summary: Get swap options for a food or meal
 *     description: Returns multiple nutrition-similar options for swapping in a meal plan day.
 *     tags: [MealPlan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [swapType, mealType]
 *                 properties:
 *                   swapType:
 *                     type: string
 *                     example: food
 *                   mealType:
 *                     type: string
 *                     example: lunch
 *                   targetFoodId:
 *                     type: string
 *                     example: "65a1f0b2c7f6a1a1a1a1a1a1"
 *                     description: Use targetFoodId or targetItemId
 *                   targetItemId:
 *                     type: string
 *                     example: "65a1f0b2c7f6a1a1a1a1a1b1"
 *                   limit:
 *                     type: number
 *                     example: 5
 *                   tolerance:
 *                     type: number
 *                     example: 0.2
 *               - type: object
 *                 required: [swapType, mealType]
 *                 properties:
 *                   swapType:
 *                     type: string
 *                     example: meal
 *                   mealType:
 *                     type: string
 *                     example: dinner
 *                   limit:
 *                     type: number
 *                     example: 5
 *     responses:
 *       200:
 *         description: Swap options returned
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Access is denied
 */
router.post(
  ROUTES.MEALPLAN.SWAP_OPTIONS,
  validateObjectId,
  validateSchema(mealPlanSwapOptionsSchema),
  mealPlanController.getSwapOptions,
);
/**
 * @swagger
 * /planner/{id}/swap:
 *   patch:
 *     summary: Apply a swap to a meal plan day
 *     description: Replace a single food or an entire meal with a chosen option.
 *     tags: [MealPlan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [swapType, mealType, replacement]
 *                 properties:
 *                   swapType:
 *                     type: string
 *                     example: food
 *                   mealType:
 *                     type: string
 *                     example: lunch
 *                   targetFoodId:
 *                     type: string
 *                     example: "65a1f0b2c7f6a1a1a1a1a1a1"
 *                     description: Use targetFoodId or targetItemId
 *                   targetItemId:
 *                     type: string
 *                     example: "65a1f0b2c7f6a1a1a1a1a1b1"
 *                   replacement:
 *                     type: object
 *                     required: [foodId]
 *                     properties:
 *                       foodId:
 *                         type: string
 *                         example: "65a1f0b2c7f6a1a1a1a1a1a2"
 *                       amount:
 *                         type: number
 *                         example: 1.5
 *                       unit:
 *                         type: number
 *                         example: 0
 *               - type: object
 *                 required: [swapType, mealType, replacement]
 *                 properties:
 *                   swapType:
 *                     type: string
 *                     example: meal
 *                   mealType:
 *                     type: string
 *                     example: dinner
 *                   replacement:
 *                     type: object
 *                     required: [items]
 *                     properties:
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           required: [foodId, amount, unit]
 *                           properties:
 *                             foodId:
 *                               type: string
 *                               example: "65a1f0b2c7f6a1a1a1a1a1a3"
 *                             amount:
 *                               type: number
 *                               example: 1
 *                             unit:
 *                               type: number
 *                               example: 0
 *     responses:
 *       200:
 *         description: Meal plan updated
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Access is denied
 */
router.patch(
  ROUTES.MEALPLAN.SWAP,
  validateObjectId,
  validateSchema(mealPlanSwapApplySchema),
  mealPlanController.applySwap,
);

export default router;
