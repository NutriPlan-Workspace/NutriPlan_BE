import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import aiController from '@/controllers/ai.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';

const router = Router();

router.use(validateAccessToken);

router.post(ROUTES.AI.CHAT, aiController.chat);

export default router;
