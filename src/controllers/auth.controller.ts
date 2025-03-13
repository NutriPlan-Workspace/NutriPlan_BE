import { Request, Response } from 'express';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import userService from '@/services/auth.service';
import {
  errorResponse,
  serverError,
  successResponse,
} from '@/utils/responseFormats';

class UserController {
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
        const payload = result.data.payload;
        res.cookie('accessToken', accessToken, { httpOnly: true });
        res
          .status(STATUS_CODE.SUCCESS.OK)
          .json(
            successResponse(
              { payload, 'access token': accessToken },
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
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(
            errorResponse(
              null,
              ERROR_MESSAGE.NO_TOKEN_PROVIDED,
              STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
            ),
          );
      } else {
        const result = await userService.logoutHandler(accessToken);
        if (!result) {
          res
            .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
            .json(
              errorResponse(
                null,
                ERROR_MESSAGE.INVALID_LOGOUT,
                STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
              ),
            );
        } else {
          res.clearCookie('accessToken');
          res
            .status(STATUS_CODE.SUCCESS.OK)
            .json(successResponse(null, SUCCESS_MESSAGE.LOGOUT_SUCCESS));
        }
      }
    } catch (error) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(serverError(error));
    }
  }
}

export default new UserController();
