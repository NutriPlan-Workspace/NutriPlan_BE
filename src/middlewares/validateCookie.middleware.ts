import { NextFunction, Request, Response } from 'express';

// ERROR_MESSAGE removed: not used in this middleware
import { UserRole } from '@/types/user.types';
import { verifyAccessToken } from '@/utils/jwtToken';
import { forbiddenResponse, unauthResponse } from '@/utils/responseFormats';

export const parseUserIfExists = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let accessToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.toLowerCase().startsWith('bearer')
    ) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (!accessToken) {
      return next();
    }

    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    return next();
  } catch {
    return next();
  }
};

export const validateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let accessToken;

    if (
      req.headers.authorization &&
      req.headers.authorization.toLowerCase().startsWith('bearer')
    ) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (!accessToken) {
      res.status(unauthResponse().code).json(unauthResponse());
      return;
    }

    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    return next();
  } catch {
    res.status(unauthResponse().code).json(unauthResponse());
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
