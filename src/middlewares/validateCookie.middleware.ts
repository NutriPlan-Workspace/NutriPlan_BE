import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { UserRole } from '@/types/user.types';
import { verifyAccessToken } from '@/utils/jwtToken';
import { forbiddenResponse, unauthResponse } from '@/utils/responseFormats';

export const validateAccesToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(unauthResponse().code).json(unauthResponse());
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res
      .status(forbiddenResponse().code)
      .json(forbiddenResponse(`${ERROR_MESSAGE.INVALID_TOKEN}: ${error}`));
    return;
  }
};

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(forbiddenResponse().code).json(forbiddenResponse());
    return;
  }
  next();
};
