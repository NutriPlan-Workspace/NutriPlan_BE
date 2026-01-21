import { Router } from 'express';

import { ROUTES } from '@/constants/routes';
import articleController from '@/controllers/article.controller';
import { validateAccessToken } from '@/middlewares/validateCookie.middleware';
import validateSchema from '@/middlewares/validateSchema.middleware';
import {
  ArticleAdminListQuerySchema,
  ArticleCreateSchema,
  ArticleListQuerySchema,
  ArticleUpdateSchema,
} from '@/schemas/article.schema';

const router = Router();

router.get(
  ROUTES.ARTICLES.GET,
  validateSchema(ArticleListQuerySchema, 'query'),
  articleController.listPublished,
);

router.get(
  ROUTES.ARTICLES.ADMIN_LIST,
  validateAccessToken,
  validateSchema(ArticleAdminListQuerySchema, 'query'),
  articleController.listAdmin,
);
router.get(
  ROUTES.ARTICLES.ADMIN_GET_BY_ID,
  validateAccessToken,
  articleController.getByIdAdmin,
);

router.get(ROUTES.ARTICLES.GET_BY_SLUG, articleController.getBySlug);

router.use(validateAccessToken);

router.post(
  ROUTES.ARTICLES.CREATE,
  validateSchema(ArticleCreateSchema),
  articleController.create,
);
router.put(
  ROUTES.ARTICLES.UPDATE,
  validateSchema(ArticleUpdateSchema),
  articleController.update,
);
router.delete(ROUTES.ARTICLES.DELETE, articleController.delete);

export default router;
