import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import userController from '@/controllers/user.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { updateUserPasswordSchema } from '@/schemas/user.schema';

const router = Router();

router.use(validateAccessToken);

router.put(
  ROUTES.USER.CHANGE_PASSWORD,
  validateSchema(updateUserPasswordSchema),
  userController.updateUserPassword,
);

export default router;
