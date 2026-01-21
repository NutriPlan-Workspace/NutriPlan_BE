import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import collectionService from '@/services/collection.service';
import {
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class MealPlanController {
  async adminListCollections(req: Request, res: Response) {
    try {
      const { q, page, limit, userId, isCurated } = req.query as unknown as {
        q?: string;
        page?: number;
        limit?: number;
        userId?: string;
        isCurated?: string;
      };

      const result = await collectionService.adminListCollections({
        q,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userId,
        isCurated: isCurated === undefined ? undefined : isCurated === 'true',
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

  async getCollection(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }
      const { q, page, limit } = req.query as unknown as {
        q?: string;
        page?: number;
        limit?: number;
      };
      const result = await collectionService.getList(userId, q, page, limit);
      if (!result) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
      } else {
        res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
      }
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

  async getCuratedCollections(req: Request, res: Response) {
    try {
      const { q, page, limit } = req.query as unknown as {
        q?: string;
        page?: number;
        limit?: number;
      };

      const result = await collectionService.getCuratedCollections({
        q,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
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

  async getCollectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await collectionService.getCollectionById(id);
      if (!result) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
      } else {
        res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
      }
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

  async createCollection(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const collectionData = { ...req.body, userId };

      const newCollection =
        await collectionService.createCollection(collectionData);

      res
        .status(STATUS_CODE.SUCCESS.CREATED)
        .json(successResponse(newCollection));
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

  async adminCreateCollection(req: Request, res: Response) {
    try {
      const userId = req.body?.userId ?? req.user?.id;
      const collectionData = {
        ...req.body,
        userId,
        isCurated: req.body?.isCurated ?? true,
      };

      const newCollection =
        await collectionService.createCollection(collectionData);

      res
        .status(STATUS_CODE.SUCCESS.CREATED)
        .json(successResponse(newCollection));
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

  async updateCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const collectionData = req.body;

      const updatedCollection = await collectionService.updateCollection(
        id,
        collectionData,
      );

      if (!updatedCollection) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(updatedCollection));
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

  async deleteCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await collectionService.deleteCollection(id);

      if (result.deletedCount === 0) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
        return;
      }
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(
          successResponse(null, SUCCESS_MESSAGE.COLLECTION_DELETED_SUCCESS),
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

  async getFavoriteFoods(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }
      const result = await collectionService.getFavoriteFoods(userId);
      if (!result) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
      } else {
        res
          .status(STATUS_CODE.SUCCESS.OK)
          .json(successResponse(result[0].foods));
      }
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

  async getExclusionCollection(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const result = await collectionService.getExclusionCollection(userId);
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
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

  async updateExclusionFoods(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const foods = req.body?.foods ?? [];
      const result = await collectionService.updateExclusionFoods(
        userId,
        foods,
      );

      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
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
  async updateFavoriteFoods(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const collectionData = req.body;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }
      const result = await collectionService.updateFavoriteFood(
        userId,
        collectionData,
      );
      if (!result) {
        res.status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND).json(notFoundResponse());
      } else {
        res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
      }
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

export default new MealPlanController();
