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
