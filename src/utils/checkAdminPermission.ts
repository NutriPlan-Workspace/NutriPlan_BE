import { Response } from 'express';

import { UserRole } from '@/types/user.types';
import { forbiddenResponse } from '@/utils/responseFormats';

export const checkAdminPermission = (
  userRole: string,
  res: Response,
): boolean => {
  if (userRole !== UserRole.ADMIN) {
    res.status(forbiddenResponse().code).json(forbiddenResponse());
    return false;
  }
  return true;
};
