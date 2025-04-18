import { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '@/constants/statusCodes';
import { PaginationSchema } from '@/schemas/pagination.schema';
import { PaginationQuery } from '@/types/query.type';
import { errorResponse } from '@/utils/responseFormats';

export const validatePagination = (
  req: Request & { query: PaginationQuery },
  res: Response,
  next: NextFunction,
): void => {
  const validation = PaginationSchema.safeParse(req.query);

  if (!validation.success) {
    res
      .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
      .json(
        errorResponse(
          null,
          validation.error.errors[0].message,
          STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
        ),
      );
    return;
  }

  req.query.page = validation.data.page || 1;
  req.query.limit = validation.data.limit || 10;
  next();
};
