import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import UserController from '@/controllers/user.controller';
import {
  isAdmin,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  adminUpdateUserRoleDto,
  avatarDto,
  excludedDto,
  primaryDietDto,
  updateUserPasswordSchema,
} from '@/schemas/user.schema';
import { nutritionGoalsDto } from '@/schemas/user.schema';
import { physicalStatUpdateDto } from '@/schemas/user.schema';

const router = Router();

router.use(validateAccessToken);

/**
 * @swagger
 * /user/nutrition-target:
 *   get:
 *     summary: Get nutrition targets
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Nutrition targets retrieved
 * */
router.get(ROUTES.USER.NUTRITION_TARGET, UserController.getNutritionTarget);

/**
 * @swagger
 * /user/nutrition-by-stats:
 *   get:
 *     summary: Calculate calories based on stats
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Calculated calories
 * */
router.get(ROUTES.USER.GET_NUTRI_BY_STATS, UserController.getCaloriesByStats);

/**
 * @swagger
 * /user/stats:
 *   get:
 *     summary: Get physical stats
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Physical stats retrieved
 * */
router.get(ROUTES.USER.GET_STATS, UserController.getPhysicalStats);

/**
 * @swagger
 * /user/primary-diet:
 *   get:
 *     summary: Get primary diet settings
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Primary diet retrieved
 * */
router.get(ROUTES.USER.GET_PRIMARY_DIET, UserController.getPrimaryDiet);

/**
 * @swagger
 * /user/food-exclusions:
 *   get:
 *     summary: Get food exclusions
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Food exclusions retrieved
 * */
router.get(ROUTES.USER.GET_FOOD_EXCLUSIONS, UserController.getFoodExclusions);

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 * */
router.get(ROUTES.USER.GET_ME, UserController.getMe);

router.get(ROUTES.USER.ADMIN_LIST, isAdmin, UserController.adminListUsers);
router.get(
  ROUTES.USER.ADMIN_GET_BY_ID,
  isAdmin,
  UserController.adminGetUserById,
);
router.patch(
  ROUTES.USER.ADMIN_UPDATE,
  isAdmin,
  validateSchema(adminUpdateUserRoleDto),
  UserController.adminUpdateUserRole,
);
router.delete(
  ROUTES.USER.ADMIN_DELETE,
  isAdmin,
  UserController.adminDeleteUser,
);

/**
 * @swagger
 * /user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 * */
router.put(
  ROUTES.USER.CHANGE_PASSWORD,
  validateSchema(updateUserPasswordSchema),
  UserController.updateUserPassword,
);
/**
 * @swagger
 * /user/nutrition-target:
 *   put:
 *     summary: Update nutrition targets
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Nutrition targets updated
 * */
router.put(
  ROUTES.USER.NUTRITION_TARGET,
  validateSchema(nutritionGoalsDto),
  UserController.updateNutritionTarget,
);
router.put(
  ROUTES.USER.EDIT_STATS,
  validateSchema(physicalStatUpdateDto),
  UserController.updatePhysicalStats,
);
router.put(
  ROUTES.USER.EDIT_PRIMARY_DIET,
  validateSchema(primaryDietDto),
  UserController.updatePrimaryDiet,
);
router.put(
  ROUTES.USER.EDIT_FOOD_EXCLUSIONS,
  validateSchema(excludedDto),
  UserController.updateFoodExclusions,
);

/**
 * @swagger
 * /user/avatar:
 *   put:
 *     summary: Update user avatar
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar updated
 * */
router.put(
  ROUTES.USER.EDIT_AVATAR,
  validateSchema(avatarDto),
  UserController.updateAvatar,
);

export default router;
