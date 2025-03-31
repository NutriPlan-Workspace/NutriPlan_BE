import { UserRepository } from '@/repositories/user.repository';
import type { User } from '@/types';
import { compare } from '@/utils/passwordHash';

class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async addUser(user: Partial<User>): Promise<User> {
    return this.repository.create(user);
  }

  async getUserById(idUser: string): Promise<User | null> {
    return this.repository.getById(idUser);
  }

  async getAllUsers(page: number, limit: number) {
    const options = {
      page,
      limit,
      select: '-password',
      sort: { createdAt: -1 },
    };
    return this.repository.paginate({}, options);
  }

  async updateUser(
    userId: string,
    updatedData: Partial<User>,
  ): Promise<User | null> {
    return this.repository.update(userId, updatedData);
  }

  async deleteUser(id: string): Promise<{ deletedCount: number }> {
    return this.repository.delete(id);
  }

  async comparePassword(password: string, hashPassword: string) {
    return compare(password, hashPassword);
  }
}

export default new UserService();
