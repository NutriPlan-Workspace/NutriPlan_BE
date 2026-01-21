import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import aiController from '@/controllers/ai.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';

const router = Router();

router.use(validateAccessToken);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with AI Assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, system, assistant]
 *                     content:
 *                       type: string
 *               stream:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: AI response (stream or json)
 * */
router.post(ROUTES.AI.CHAT, aiController.chat);

export default router;
