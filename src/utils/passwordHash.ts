import bcrypt from 'bcryptjs';

import { SALT_ROUNDS } from '@/configs/secrets';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const compare = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => bcrypt.compare(password, hashPassword);
