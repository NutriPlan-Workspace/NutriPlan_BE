import { compare } from 'bcryptjs';

import { UserModel } from '@/models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from '@/utils/jwtToken';

class UserService {
  async loginHandler(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return null;
    }

    const isMatch = compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    const payload = {
      id: user.id as string,
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
}

export default new UserService();
