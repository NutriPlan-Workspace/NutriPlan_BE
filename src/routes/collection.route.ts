import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import collectionController from '@/controllers/collection.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  collectionQuerySchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
  UpdateFavoriteListSchema,
} from '@/schemas/collection.schema';

const router = Router();

router.use(validateAccessToken);

router.get(
  ROUTES.COLLECTION.GET,
  validateSchema(collectionQuerySchema, 'query'),
  collectionController.getCollection,
);
router.get(
  ROUTES.COLLECTION.GET_FAVORITES,
  collectionController.getFavoriteFoods,
);
router.get(
  ROUTES.COLLECTION.GET_BY_ID,
  validateObjectId,
  collectionController.getCollectionById,
);
router.post(
  ROUTES.COLLECTION.POST,
  validateSchema(CreateCollectionSchema),
  collectionController.createCollection,
);
router.put(
  ROUTES.COLLECTION.UPDATE_FAVORITES,
  validateSchema(UpdateFavoriteListSchema),
  collectionController.updateFavoriteFoods,
);
router.put(
  ROUTES.COLLECTION.PUT,
  validateObjectId,
  validateSchema(UpdateCollectionSchema),
  collectionController.updateCollection,
);
router.delete(
  ROUTES.COLLECTION.DELETE,
  validateObjectId,
  collectionController.deleteCollection,
);

export default router;
