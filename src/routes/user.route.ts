import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import UserController from '@/controllers/user.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  primaryDietDto,
  updateUserPasswordSchema,
} from '@/schemas/user.schema';
import { nutritionGoalsDto } from '@/schemas/user.schema';
import { physicalStatDto } from '@/schemas/user.schema';

const router = Router();

router.use(validateAccessToken);

router.get(ROUTES.USER.NUTRITION_TARGET, UserController.getNutritionTarget);
router.get(ROUTES.USER.GET_NUTRI_BY_STATS, UserController.getCaloriesByStats);
router.get(ROUTES.USER.GET_STATS, UserController.getPhysicalStats);
router.get(ROUTES.USER.GET_PRIMARY_DIET, UserController.getPrimaryDiet);
router.get(ROUTES.USER.GET_ME, UserController.getMe);

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
  validateSchema(physicalStatDto),
  UserController.updatePhysicalStats,
);
router.put(
  ROUTES.USER.EDIT_PRIMARY_DIET,
  validateSchema(primaryDietDto),
  UserController.updatePrimaryDiet,
);

export default router;
