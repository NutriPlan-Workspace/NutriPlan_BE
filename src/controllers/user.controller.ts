import { Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import userService from '@/services/user.service';
import type { TokenPayload, User } from '@/types/user.types';
import { hashPassword } from '@/utils/passwordHash';
import {
  errorResponse,
  notFoundResponse,
  serverError,
  successResponse,
} from '@/utils/responseFormats';

class UserController {
  constructor() {
    this.updateUserPassword = this.updateUserPassword.bind(this);
    this.getMe = this.getMe.bind(this);
    this.updateAvatar = this.updateAvatar.bind(this);
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

  async getPhysicalStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.getPhysicalStats(userId!);
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

  async updatePhysicalStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.updatePhysicalStats(userId!, req.body);
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

  async getCaloriesByStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.getCaloriesByStats(userId!);
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

  async getPrimaryDiet(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.getPrimaryDiet(userId!);
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

  async updatePrimaryDiet(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.updatePrimaryDiet(
        userId!,
        req.body.primaryDiet,
      );
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

  async getFoodExclusions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await userService.getFoodExclusions(userId!);
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

  async updateFoodExclusions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await userService.updateFoodExclusions(userId!, req.body);
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

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.USER.NOT_FOUND,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
        return;
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.NOT_FOUND)
          .json(notFoundResponse(ERROR_MESSAGE.USER.NOT_FOUND));
        return;
      }

      const responseUser = this.formatUserResponse(user);
      res.status(STATUS_CODE.SUCCESS.OK).json(successResponse(responseUser));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async updateAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(errorResponse(ERROR_MESSAGE.AUTH_ERROR));
        return;
      }

      const { avatarUrl } = req.body;
      const updated = await userService.updateUser(userId, { avatarUrl });
      if (!updated) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(errorResponse(ERROR_MESSAGE.USER.UPDATE_FAILED));
        return;
      }

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse({ avatarUrl: updated.avatarUrl }));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  private formatUserResponse(user: User): TokenPayload {
    return {
      id: user._id as string,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }
}
export default new UserController();
