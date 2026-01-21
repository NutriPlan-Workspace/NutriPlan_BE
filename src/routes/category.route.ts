import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import categoryController from '@/controllers/category.controller';
import {
  isAdmin,
  validateAccessToken,
} from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  categoryAdminListQuerySchema,
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@/schemas/category.schema';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List public categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 * */
router.get(ROUTES.CATEGORY.GET, categoryController.listPublic);

router.use(validateAccessToken);

router.get(
  ROUTES.CATEGORY.ADMIN_LIST,
  isAdmin,
  validateSchema(categoryAdminListQuerySchema, 'query'),
  categoryController.listAdmin,
);
router.post(
  ROUTES.CATEGORY.ADMIN_CREATE,
  isAdmin,
  validateSchema(categoryCreateSchema),
  categoryController.createAdmin,
);
router.put(
  ROUTES.CATEGORY.ADMIN_UPDATE,
  isAdmin,
  validateSchema(categoryUpdateSchema),
  categoryController.updateAdmin,
);
router.delete(
  ROUTES.CATEGORY.ADMIN_DELETE,
  isAdmin,
  categoryController.deleteAdmin,
);

export default router;
