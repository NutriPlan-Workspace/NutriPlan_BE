import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import analyticsService from '@/services/analytics.service';
import { decodeAccessToken } from '@/utils/jwtToken';
import {
  errorResponse,
  serverError,
  successResponse,
} from '@/utils/responseFormats';

class AnalyticsController {
  async trackFoodView(req: Request, res: Response) {
    try {
      const { foodId, source } = req.body as {
        foodId?: string;
        source?: string;
      };
      if (!foodId || !Types.ObjectId.isValid(foodId)) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(null, ERROR_MESSAGE.INVALID_PARAMETER));
        return;
      }

      const decoded = decodeAccessToken(req);
      await analyticsService.trackFoodView(foodId, decoded?.id, source);

      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async trackArticleView(req: Request, res: Response) {
    try {
      const { articleId, source } = req.body as {
        articleId?: string;
        source?: string;
      };
      if (!articleId || !Types.ObjectId.isValid(articleId)) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(null, ERROR_MESSAGE.INVALID_PARAMETER));
        return;
      }

      const decoded = decodeAccessToken(req);
      await analyticsService.trackArticleView(articleId, decoded?.id, source);

      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(stats));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async trackCuratedCollectionView(req: Request, res: Response) {
    try {
      const { collectionId, source } = req.body as {
        collectionId?: string;
        source?: string;
      };

      if (!collectionId || !Types.ObjectId.isValid(collectionId)) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(null, ERROR_MESSAGE.INVALID_PARAMETER));
        return;
      }

      const decoded = decodeAccessToken(req);
      await analyticsService.trackCuratedCollectionView(
        collectionId,
        decoded?.id,
        source,
      );

      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async trackCuratedCollectionCopy(req: Request, res: Response) {
    try {
      const { collectionId, destinationCollectionId, source } = req.body as {
        collectionId?: string;
        destinationCollectionId?: string;
        source?: string;
      };

      if (!collectionId || !Types.ObjectId.isValid(collectionId)) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(null, ERROR_MESSAGE.INVALID_PARAMETER));
        return;
      }

      if (
        destinationCollectionId &&
        !Types.ObjectId.isValid(destinationCollectionId)
      ) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(null, ERROR_MESSAGE.INVALID_PARAMETER));
        return;
      }

      const decoded = decodeAccessToken(req);
      await analyticsService.trackCuratedCollectionCopy(
        collectionId,
        decoded?.id,
        destinationCollectionId,
        source,
      );

      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse());
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }
}

export default new AnalyticsController();
