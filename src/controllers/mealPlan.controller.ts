import { Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import mealPlanService from '@/services/mealPlan.service';
import {
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class MealPlanController {
  async addFoodToMealPlan(req: Request, res: Response) {
    try {
      const result = await mealPlanService.addFoodToMealPlan(req.body);
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

  async editDayMealPlan(req: Request, res: Response) {
    try {
      const result = await mealPlanService.editDayMealPlan(req.body);
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

  async getMealPlanByDate(req: Request, res: Response) {
    try {
      const date = req.params.date as string;
      const userId = req.params.userId;
      const result = await mealPlanService.getMealPlanByDate(
        new Date(date),
        userId,
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

  async getMealPlanByWeek(req: Request, res: Response) {
    try {
      const date = req.params.date as string;
      const userId = req.params.userId;
      const result = await mealPlanService.getMealPlanByWeek(
        new Date(date),
        userId,
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

  async getMealPlanByRange(req: Request, res: Response) {
    try {
      const dateFrom = req.params.from as string;
      const dateTo = req.params.to as string;
      const userId = req.params.userId;
      const result = await mealPlanService.getMealPlanByRange(
        new Date(dateFrom),
        new Date(dateTo),
        userId,
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

  async removeFoodFromMealPlan(req: Request, res: Response) {
    try {
      const foodId = req.params.foodId;
      const result = await mealPlanService.removeFoodFromMealPlan(
        req.body,
        foodId,
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
