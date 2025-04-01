import { Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import userService from '@/services/user.service';
import { hashPassword } from '@/utils/passwordHash';
import {
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/utils/responseFormats';

class UserController {
  constructor() {
    this.updateUserPassword = this.updateUserPassword.bind(this);
  }

  async updateUserPassword(req: Request, res: Response) {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    try {
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND)
          .json(notFoundResponse(ERROR_MESSAGE.USER.NOT_FOUND));
        return;
      }

      const isPasswordCorrect = await userService.comparePassword(
        oldPassword,
        user.password,
      );
      if (!isPasswordCorrect) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(
            errorResponse(
              ERROR_MESSAGE.USER.CHANGE_PASSWORD.INCORRECT_OLD_PASSWORD,
            ),
          );
        return;
      }

      const hashedPassword = await hashPassword(newPassword);
      const updateSuccess = await userService.updateUser(userId, {
        password: hashedPassword,
      });

      if (!updateSuccess) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(ERROR_MESSAGE.USER.UPDATE_FAILED));
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

  async getNutritionTarget(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.getNutritionTarget(userId!);
      if (!result) {
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

  async updateNutritionTarget(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.updateNutritionTarget(userId!, req.body);
      if (!result) {
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
}
export default new UserController();
