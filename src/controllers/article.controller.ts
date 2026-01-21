import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import {
  ArticleAdminListQuerySchema,
  ArticleCreateSchema,
  ArticleListQuerySchema,
  ArticleUpdateSchema,
} from '@/schemas/article.schema';
import { ArticleService } from '@/services/article.service';
import { checkAdminPermission } from '@/utils/checkAdminPermission';
import { errorResponse, successResponse } from '@/utils/responseFormats';

class ArticleController {
  private service: ArticleService;

  constructor() {
    this.service = new ArticleService();
  }

  listPublished = async (req: Request, res: Response) => {
    try {
      const query = ArticleListQuerySchema.parse(req.query);
      const items = await this.service.listPublished(query);
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse({ items }, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  listAdmin = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.AUTH_ERROR,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      if (!checkAdminPermission(req.user.role, res)) return;

      const query = ArticleAdminListQuerySchema.parse(req.query);
      const result = await this.service.listAdmin(query);
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(result, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  getByIdAdmin = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.AUTH_ERROR,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      if (!checkAdminPermission(req.user.role, res)) return;

      const id = req.params.id;
      const article = await this.service.getByIdAdmin(id);
      if (!article) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.NOT_FOUND,
              STATUS_CODE.CLIENT_ERROR.NOT_FOUND,
            ),
          );
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(article, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  getBySlug = async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const article = await this.service.getPublishedBySlug(slug);
      if (!article) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.NOT_FOUND,
              STATUS_CODE.CLIENT_ERROR.NOT_FOUND,
            ),
          );
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(article, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.AUTH_ERROR,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      if (!checkAdminPermission(req.user.role, res)) return;

      const input = ArticleCreateSchema.parse(req.body);
      const article = await this.service.create(input, req.user.id);

      res
        .status(STATUS_CODE.SUCCESS.CREATED)
        .json(successResponse(article, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.AUTH_ERROR,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      if (!checkAdminPermission(req.user.role, res)) return;

      const id = req.params.id;
      const input = ArticleUpdateSchema.parse(req.body);
      const article = await this.service.update(id, input, req.user.id);

      if (!article) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.NOT_FOUND,
              STATUS_CODE.CLIENT_ERROR.NOT_FOUND,
            ),
          );
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(article, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.AUTH_ERROR,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      if (!checkAdminPermission(req.user.role, res)) return;

      const id = req.params.id;
      const result = await this.service.delete(id);
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(result, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            `${ERROR_MESSAGE.ERROR} ${error}`,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };
}

export default new ArticleController();
