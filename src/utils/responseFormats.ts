import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';

export const successResponse = <T>(
  data?: T,
  message = SUCCESS_MESSAGE.REQUEST_SUCCESS,
  code = STATUS_CODE.SUCCESS.OK,
) => ({
  success: true,
  code,
  message,
  data,
});

export const errorResponse = <T>(
  data?: T,
  message = ERROR_MESSAGE.INVALID_PARAMETER,
  code = STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
) => ({
  success: false,
  code,
  message,
  data,
});

export const unauthResponse = (
  message = ERROR_MESSAGE.AUTH_ERROR,
  code = STATUS_CODE.CLIENT_ERROR.UNAUTHORIZED,
) => ({
  success: false,
  code,
  message,
  data: null,
});

export const forbiddenResponse = (
  message = ERROR_MESSAGE.AUTH_ERROR,
  code = STATUS_CODE.CLIENT_ERROR.FORBIDDEN,
) => ({
  success: false,
  code,
  message,
  data: null,
});

export const notFoundResponse = (
  message = ERROR_MESSAGE.NOTFOUND,
  code = STATUS_CODE.CLIENT_ERROR.NOT_FOUND,
) => ({
  success: false,
  code,
  message,
  data: null,
});

export const serverError = <T>(
  data: T,
  message = ERROR_MESSAGE.SERVER_ERROR,
  code = STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
) => ({
  success: false,
  code,
  message,
  data,
});
