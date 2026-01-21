import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import categoryService from '@/services/category.service';
import {
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class CategoryController {
  async listPublic(req: Request, res: Response) {
    try {
      const items = await categoryService.listAll();
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(items, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.SERVER_ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }

  async listAdmin(req: Request, res: Response) {
    try {
      const { page, limit, q } = req.query as unknown as {
        page?: number;
        limit?: number;
        q?: string;
      };

      const result = await categoryService.listAdmin({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        q,
      });

      res.status(STATUS_CODE.SUCCESS.OK).json(
        successResponse({
          items: result.docs,
          total: result.totalDocs,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }),
      );
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.SERVER_ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }

  async createAdmin(req: Request, res: Response) {
    try {
      const created = await categoryService.createCategory(req.body);
      res
        .status(STATUS_CODE.SUCCESS.CREATED)
        .json(successResponse(created, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.SERVER_ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }

  async updateAdmin(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const updated = await categoryService.updateCategory(id, req.body);
      if (!updated) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(updated, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.SERVER_ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }

  async deleteAdmin(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await categoryService.deleteCategory(id);
      if (!result?.deletedCount) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(null, SUCCESS_MESSAGE.REQUEST_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.SERVER_ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }
}

export default new CategoryController();
