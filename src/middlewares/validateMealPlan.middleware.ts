import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import { errorResponse } from '@/utils/responseFormats';

export function validateMealPlanDateRange(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { date, from, to } = req.query;

  if (date) {
    return next();
  }

  if (from && to) {
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (fromDate > toDate) {
      res
        .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
        .json(errorResponse(ERROR_MESSAGE.INVALID_RANGE));
      return;
    }

    const dayDiff =
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff > 7) {
      res
        .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
        .json(errorResponse(ERROR_MESSAGE.RANGE_TOO_LARGE));
      return;
    }

    return next();
  }

  res
    .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
    .json(errorResponse(ERROR_MESSAGE.INVALID_PARAMETER));
  return;
}
