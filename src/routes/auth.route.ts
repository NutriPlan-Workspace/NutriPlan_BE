import { Router } from 'express';
import validateAuth from 'middlewares/validateAuth.middleware';

import { ROUTES } from '@/constants/routes';
import userController from '@/controllers/auth.controller';
import {
  loginSchemaValidate,
  logoutSchemaValidate,
} from '@/validations/auth.validates';

const router = Router();

router.post(
  ROUTES.AUTH.LOGIN,
  validateAuth(loginSchemaValidate),
  userController.login,
);

router.post(
  ROUTES.AUTH.LOGOUT,
  validateAuth(logoutSchemaValidate),
  userController.logout,
);

export default router;
