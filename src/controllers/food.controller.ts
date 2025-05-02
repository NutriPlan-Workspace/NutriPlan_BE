import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import { FoodSchema, FoodUpdateSchema } from '@/schemas/food.schema';
import { FoodFilterSchema } from '@/schemas/foodFilter.schema';
import { searchFoodSchema } from '@/schemas/searchFood.schema';
import { FoodService } from '@/services/food.service';
import { checkAdminPermission } from '@/utils/checkAdminPermission';
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

  createFood = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { type, ...foodData } = FoodSchema.parse(req.body);
      let result;

      switch (type) {
        case 'customFood':
          result = await this.foodService.createCustomFood(foodData, userId!);
          break;
        case 'customRecipe':
          result = await this.foodService.createCustomRecipe(foodData, userId!);
          break;
        case 'create': {
          if (!checkAdminPermission(userRole!, res)) {
            return;
          }
          result = await this.foodService.create(foodData);
          break;
        }
        default:
          throw new Error(ERROR_MESSAGE.INVALID_TYPE);
      }
      if (!result) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.INGREDIENTS_REQUIRED,
              STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
            ),
          );
        return;
      }
      res.status(STATUS_CODE.SUCCESS.CREATED).json(successResponse(result));
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

  updateFood = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = req.user;
      const updatedFood = FoodUpdateSchema.parse(req.body);
      const result = await this.foodService.update(id, user!, updatedFood);
      if (!result) {
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
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
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

  deleteFood = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await this.foodService.delete(id, req.user!);
      if (!result) {
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
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(result));
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

export default new FoodController();
