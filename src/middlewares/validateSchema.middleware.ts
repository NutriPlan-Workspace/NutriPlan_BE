import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { STATUS_CODE } from '@/constants/statusCodes';
import { errorResponse } from '@/utils/responseFormats';

const validateSchema =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const groupedErrors = error.errors.reduce<Record<string, string[]>>(
          (acc, err) => {
            const field = err.path.join('.');
            if (!acc[field]) {
              acc[field] = [];
            }
            acc[field].push(err.message);
            return acc;
          },
          {},
        );

        const formattedErrors = Object.entries(groupedErrors).map(
          ([field, messages]) => ({
            field,
            messages,
          }),
        );

        res
          .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
          .json(
            errorResponse(
              formattedErrors,
              ERROR_MESSAGE.INVALID_PARAMETER,
              STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
            ),
          );
      } else {
        next(error);
      }
    }
  };

export default validateSchema;
