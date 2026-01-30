import { Request } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

import {
  ACCESS_EXPIRES_IN,
  ACCESS_SECRET,
  REFRESH_EXPIRES_IN,
  REFRESH_SECRET,
} from '@/configs/secrets';
import type { TokenPayload } from '@/types';

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES_IN };
  return jwt.sign(payload, ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_IN };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  return decoded;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  return decoded;
};
export const decodeAccessToken = (req: Request): TokenPayload | null => {
  try {
    let token = req.cookies.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return null;

    const decoded = verifyAccessToken(token);
    return decoded;
  } catch {
    return null;
  }
};
