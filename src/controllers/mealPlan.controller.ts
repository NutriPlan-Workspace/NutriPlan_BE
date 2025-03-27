import { Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import mealPlanService from '@/services/mealPlan.service';
import {
  emptyArrayResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class MealPlanController {
  async addFoodToMealPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await mealPlanService.addFoodToMealPlan(req.body, userId!);
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
      const mealPlanId = req.params.id;
      const result = await mealPlanService.editDayMealPlan(
        mealPlanId,
        req.body,
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

  async getMealPlan(req: Request, res: Response) {
    try {
      const date = req.query?.date;
      const from = req.query?.from;
      const to = req.query?.to;
      const week = req.query?.week;
      const userId = req.user?.id;
      let result;
      if (date && week === 'true') {
        result = await mealPlanService.getMealPlanByWeek(
          new Date(date as string),
          userId!,
        );
      } else if (date) {
        result = await mealPlanService.getMealPlanByDate(
          new Date(date as string),
          userId!,
        );
      } else if (from && to) {
        result = await mealPlanService.getMealPlanByRange(
          new Date(from as string),
          new Date(to as string),
          userId!,
        );
      } else if (week === 'true') {
        result = await mealPlanService.getMealPlanByWeek(new Date(), userId!);
      }
      if (!result || (Array.isArray(result) && result.length === 0)) {
        res.status(STATUS_CODE.SUCCESS.OK).json(emptyArrayResponse());
        return;
      }

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

  async removeFoodFromMealPlan(req: Request, res: Response) {
    try {
      const mealPlanId = req.params.id;
      const result = mealPlanService.removeMealPlan(mealPlanId);
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
