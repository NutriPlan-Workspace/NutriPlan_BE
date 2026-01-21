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

router.get(ROUTES.USER.NUTRITION_TARGET, UserController.getNutritionTarget);
router.get(ROUTES.USER.GET_NUTRI_BY_STATS, UserController.getCaloriesByStats);
router.get(ROUTES.USER.GET_STATS, UserController.getPhysicalStats);
router.get(ROUTES.USER.GET_PRIMARY_DIET, UserController.getPrimaryDiet);
router.get(ROUTES.USER.GET_FOOD_EXCLUSIONS, UserController.getFoodExclusions);
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

router.put(
  ROUTES.USER.CHANGE_PASSWORD,
  validateSchema(updateUserPasswordSchema),
  UserController.updateUserPassword,
);
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

router.put(
  ROUTES.USER.EDIT_AVATAR,
  validateSchema(avatarDto),
  UserController.updateAvatar,
);

export default router;
