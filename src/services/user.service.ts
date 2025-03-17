import { UserModel } from '@/models';
import type { User } from '@/types';

class UserService {
  async addUser(user: Partial<User>): Promise<User> {
    return UserModel.create(user);
  }

  async getUserById(idUser: string): Promise<User | null> {
    return UserModel.findById(idUser);
  }

  async getAllUsers(page: number, limit: number) {
    const options = {
      page,
      limit,
      select: '-password',
      sort: { createdAt: -1 },
    };
    return UserModel.paginate({}, options);
  }

  async updateUser(
    id: string,
    updatedData: Partial<User>,
  ): Promise<User | null> {
    return UserModel.findByIdAndUpdate(id, updatedData, { new: true });
  }

  async deleteUser(id: string): Promise<User | null> {
    return UserModel.findByIdAndDelete(id);
  }
}

export default new UserService();
