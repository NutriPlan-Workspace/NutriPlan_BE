import { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '@/constants/statusCodes';
import { searchFoodSchema } from '@/schemas/searchFood.schema';
import { errorResponse } from '@/utils/responseFormats';

export const validateSearchFood = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = searchFoodSchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.format();

    res
      .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
      .json(errorResponse(errors));
    return;
  }

  next();
};
