import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import pantryController from '@/controllers/pantry.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  pantryConsumeSchema,
  pantryItemSchema,
  pantryQuerySchema,
} from '@/schemas/pantry.schema';

const router = Router();

router.use(validateAccessToken);

/**
 * @swagger
 * /pantry:
 *   get:
 *     summary: List pantry items
 *     tags: [Pantry]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_pantry, need_buy]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of items found
 * */
router.get(
  ROUTES.PANTRY.GET,
  validateSchema(pantryQuerySchema, 'query'),
  pantryController.list,
);
router.get(ROUTES.PANTRY.SUGGESTIONS, pantryController.getSuggestions);
router.post(
  ROUTES.PANTRY.POST,
  validateSchema(pantryItemSchema),
  pantryController.upsert,
);
/**
 * @swagger
 * /pantry/consume:
 *   post:
 *     summary: Consume items (reduce quantity)
 *     tags: [Pantry]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, quantity]
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Items consumed
 * */
router.post(
  ROUTES.PANTRY.CONSUME,
  validateSchema(pantryConsumeSchema),
  pantryController.consume,
);
router.put(
  ROUTES.PANTRY.PUT,
  validateObjectId,
  validateSchema(pantryItemSchema.partial()),
  pantryController.update,
);
router.delete(ROUTES.PANTRY.DELETE, validateObjectId, pantryController.remove);

export default router;
