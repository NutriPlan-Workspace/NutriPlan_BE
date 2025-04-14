import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGE } from '@/constants/messages';
import { UserRole } from '@/types/user.types';
import {
  generateAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/utils/jwtToken';
import { forbiddenResponse, unauthResponse } from '@/utils/responseFormats';

export const validateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      res.status(unauthResponse().code).json(unauthResponse());
      return;
    }

    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    return next();
  } catch {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(unauthResponse().code).json(unauthResponse());
        return;
      }

      const decodedRefresh = verifyRefreshToken(refreshToken);
      if (!decodedRefresh) {
        res.status(unauthResponse().code).json(unauthResponse());
        return;
      }

      const payload = {
        id: decodedRefresh.id,
        email: decodedRefresh.email,
        fullName: decodedRefresh.fullName,
        role: decodedRefresh.role,
      };
      const newAccessToken = generateAccessToken(payload);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
      });

      req.user = decodedRefresh;
      return next();
    } catch {
      res
        .status(forbiddenResponse().code)
        .json(forbiddenResponse(`${ERROR_MESSAGE.INVALID_TOKEN}`));
      return;
    }
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
