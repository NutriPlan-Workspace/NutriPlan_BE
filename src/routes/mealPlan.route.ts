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
