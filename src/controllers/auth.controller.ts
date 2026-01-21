import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import userService from '@/services/auth.service';
import type { User, UserResponse } from '@/types/user.types';
import {
  errorResponse,
  serverError,
  successResponse,
} from '@/utils/responseFormats';

class AuthController {
  constructor() {
    this.register = this.register.bind(this);
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await userService.loginHandler(email, password);
      if (!result) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.INVALID_LOGIN,
              STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
            ),
          );
      } else {
        const accessToken = result.accessToken;
        const refreshToken = result.refreshToken;
        const payload = result.data.payload;

        // Also include tokens in the response body so SPA clients can store and forward them
        res
          .status(STATUS_CODE.SUCCESS.OK)
          .json(
            successResponse(
              { payload, accessToken, refreshToken },
              SUCCESS_MESSAGE.LOGIN_SUCCESS,
            ),
          );
      }
    } catch (error) {
      res
        .status(STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED)
        .json(
          errorResponse(
            error,
            ERROR_MESSAGE.ERROR,
            STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
          ),
        );
    }
  }

  async logout(req: Request, res: Response) {
    try {
      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse(null, SUCCESS_MESSAGE.LOGOUT_SUCCESS));
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const createdUser = await userService.createUser(req.body);
      const user = createdUser.toObject ? createdUser.toObject() : createdUser;
      const responseUser = this.formatUserResponse(user);
      res
        .status(STATUS_CODE.SUCCESS.CREATED)
        .json(
          successResponse(
            responseUser,
            SUCCESS_MESSAGE.REGISTER_SUCCESS,
            STATUS_CODE.SUCCESS.CREATED,
          ),
        );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(message));
    }
  }

  private formatUserResponse(user: User): UserResponse {
    return {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }
}
export default new AuthController();
