import jwt, { SignOptions } from 'jsonwebtoken';

import {
  ACCESS_EXPIRES_IN,
  ACCESS_SECRET,
  REFRESH_EXPIRES_IN,
  REFRESH_SECRET,
} from '@/configs/secrets';

interface TokenPayload {
  id: string;
  email: string;
  fullName: string;
}

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
