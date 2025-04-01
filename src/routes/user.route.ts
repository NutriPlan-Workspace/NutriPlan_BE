import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import userController from '@/controllers/user.controller';
import UserController from '@/controllers/user.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { updateUserPasswordSchema } from '@/schemas/user.schema';
import { nutritionGoalsDto } from '@/schemas/user.schema';

const router = Router();

router.use(validateAccessToken);

router.get(ROUTES.USER.NUTRITION_TARGET, UserController.getNutritionTarget);
router.put(
  ROUTES.USER.CHANGE_PASSWORD,
  validateSchema(updateUserPasswordSchema),
  userController.updateUserPassword,
);
router.put(
  ROUTES.USER.NUTRITION_TARGET,
  validateSchema(nutritionGoalsDto),
  UserController.updateNutritionTarget,
);

export default router;
