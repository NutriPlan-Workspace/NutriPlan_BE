import { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '@/constants/statusCodes';
import { ObjectIdSchema } from '@/schemas/objectId.schema';
import { errorResponse } from '@/utils/responseFormats';

export const validateObjectId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const validation = ObjectIdSchema.safeParse(req.params.id);

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

  next();
};
