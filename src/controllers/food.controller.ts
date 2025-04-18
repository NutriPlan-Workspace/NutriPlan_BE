import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import { FoodFilterSchema } from '@/schemas/foodFilter.schema';
import { searchFoodSchema } from '@/schemas/searchFood.schema';
import { FoodService } from '@/services/food.service';
import { decodeAccessToken } from '@/utils/jwtToken';
import {
  errorResponse,
  serverError,
  successResponse,
} from '@/utils/responseFormats';

class FoodController {
  private foodService: FoodService;

  constructor() {
    this.foodService = new FoodService();
  }

  getFoodByID = async (req: Request, res: Response) => {
    const idFood = req.params.id as string;
    if (!idFood) {
      res
        .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
        .json(
          errorResponse(
            null,
            ERROR_MESSAGE.INVALID_PARAMETER,
            STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
          ),
        );
    } else {
      const result = await this.foodService.getById(idFood);

      if (!result) {
        res
          .status(STATUS_CODE.SERVER_ERROR.SERVICE_UNAVAILABLE)
          .json(
            serverError(
              result,
              ERROR_MESSAGE.ERROR,
              STATUS_CODE.SERVER_ERROR.SERVICE_UNAVAILABLE,
            ),
          );
      } else {
        res.status(STATUS_CODE.SUCCESS.OK).json(
          successResponse(
            {
              mainFood: result.mainFood,
              ingredientList: result.ingredientList,
            },
            SUCCESS_MESSAGE.REQUEST_SUCCESS,
            STATUS_CODE.SUCCESS.OK,
          ),
        );
      }
    }
  };

  getListFood = async (req: Request, res: Response) => {
    try {
      const parseSchema = FoodFilterSchema.parse(req.query);
      const decoded = decodeAccessToken(req);
      const result = await this.foodService.getList(parseSchema, decoded);

      if (!result) {
        res
          .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.ERROR,
              STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
            ),
          );
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(
          successResponse(
            result,
            SUCCESS_MESSAGE.REQUEST_SUCCESS,
            STATUS_CODE.SUCCESS.OK,
          ),
        );
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

  searchFood = async (req: Request, res: Response) => {
    try {
      const { q, allSearch, filters } = searchFoodSchema.parse(req.query);
      const decoded = decodeAccessToken(req);
      const result = await this.foodService.searchFood(
        allSearch,
        filters,
        decoded,
        q,
      );
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(
          successResponse(
            result,
            SUCCESS_MESSAGE.REQUEST_SUCCESS,
            STATUS_CODE.SUCCESS.OK,
          ),
        );
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.ERROR,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };
}

export default new FoodController();
