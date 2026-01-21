import { Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import pantryService from '@/services/pantry.service';
import {
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class PantryController {
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const { q, status } = req.query as {
        q?: string;
        status?: 'in_pantry' | 'need_buy';
      };

      const items = await pantryService.list(userId, { q, status });
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(items));
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

  async upsert(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const item = await pantryService.upsert(userId, req.body);
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(item));
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

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await pantryService.update(id, req.body);
      if (!updated) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(updated));
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

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pantryService.remove(id);
      if (!result.deletedCount) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
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

  async consume(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      await pantryService.consume(userId, req.body.items ?? []);
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
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

  async getSuggestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const limit = Number(req.query.limit) || 6;
      const data = await pantryService.getSuggestions(userId, limit);
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(data));
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

export default new PantryController();
