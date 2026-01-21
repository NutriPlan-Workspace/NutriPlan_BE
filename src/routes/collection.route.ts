import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import collectionController from '@/controllers/collection.controller';
import {
  isAdmin,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';
import { validateObjectId } from '@/middlewares/validateObjectId.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  AdminCreateCollectionSchema,
  collectionQuerySchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
  UpdateExclusionListSchema,
  UpdateFavoriteListSchema,
} from '@/schemas/collection.schema';

const router = Router();

router.use(validateAccessToken);

router.get(
  ROUTES.COLLECTION.ADMIN_LIST,
  isAdmin,
  validateSchema(collectionQuerySchema, 'query'),
  collectionController.adminListCollections,
);
router.get(
  ROUTES.COLLECTION.ADMIN_GET_BY_ID,
  isAdmin,
  validateObjectId,
  collectionController.getCollectionById,
);
router.post(
  ROUTES.COLLECTION.ADMIN_CREATE,
  isAdmin,
  validateSchema(AdminCreateCollectionSchema),
  collectionController.adminCreateCollection,
);
router.put(
  ROUTES.COLLECTION.ADMIN_UPDATE,
  isAdmin,
  validateObjectId,
  validateSchema(UpdateCollectionSchema),
  collectionController.updateCollection,
);
router.delete(
  ROUTES.COLLECTION.ADMIN_DELETE,
  isAdmin,
  validateObjectId,
  collectionController.deleteCollection,
);

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: Get user collections
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of collections
 * */
router.get(
  ROUTES.COLLECTION.GET,
  validateSchema(collectionQuerySchema, 'query'),
  collectionController.getCollection,
);

/**
 * @swagger
 * /collections/curated:
 *   get:
 *     summary: Get curated collections
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of curated collections
 * */
router.get(
  ROUTES.COLLECTION.CURATED,
  validateSchema(collectionQuerySchema, 'query'),
  collectionController.getCuratedCollections,
);
/**
 * @swagger
 * /collections/favorites:
 *   get:
 *     summary: Get favorite foods
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of favorite foods
 * */
router.get(
  ROUTES.COLLECTION.GET_FAVORITES,
  collectionController.getFavoriteFoods,
);

/**
 * @swagger
 * /collections/exclusions:
 *   get:
 *     summary: Get exclusion list
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Exclusion list retrieved
 * */
router.get(
  ROUTES.COLLECTION.GET_EXCLUSIONS,
  collectionController.getExclusionCollection,
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
  ROUTES.COLLECTION.UPDATE_EXCLUSIONS,
  validateSchema(UpdateExclusionListSchema),
  collectionController.updateExclusionFoods,
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
