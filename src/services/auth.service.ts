import { compare } from 'bcryptjs';
import { InferSchemaType } from 'mongoose';

import { UserModel } from '@/models';
import { CreateUserDto } from '@/schemas/user.schema';
import type { TokenPayload } from '@/types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from '@/utils/jwtToken';
import { hashPassword } from '@/utils/passwordHash';

export type UserType = InferSchemaType<typeof UserModel.schema>;

class AuthService {
  async loginHandler(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return null;
    }

    const isMatch = compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;

    await user.save();

    return {
      accessToken: accessToken,
      data: { payload },
    };
  }

  async logoutHandler(accessToken: string) {
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return null;
    }

    const result = await UserModel.findOneAndUpdate(
      { _id: decoded.id },
      { refreshToken: null },
    );

    return result;
  }

  async createUser(userData: CreateUserDto): Promise<UserType> {
    userData.password = await hashPassword(userData.password);
    const user = new UserModel(userData);
    return await user.save();
  }
}

export default new AuthService();
