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

  async updatePhysicalStats(
    userId: string,
    physicalStats: Partial<User['physicalStat']>,
  ) {
    const user = await this.repository.getById(userId);
    if (!user) {
      return null;
    }

    user.physicalStat ||= {};

    user.physicalStat.heightRecords ||= [];
    user.physicalStat.weightRecords ||= [];

    const today = new Date().toISOString().split('T')[0];
    if (physicalStats?.heightRecords?.length) {
      user.physicalStat.heightRecords ??= [];
      const latestHeightRecord = user.physicalStat.heightRecords.slice(-1)[0];
      if (latestHeightRecord?.date.toISOString().split('T')[0] === today) {
        latestHeightRecord.height = physicalStats.heightRecords[0].height;
      } else {
        user.physicalStat.heightRecords.push({
          height: physicalStats.heightRecords[0].height,
          date: new Date(),
        });
      }
    }
    if (physicalStats?.weightRecords?.length) {
      const latestWeightRecord = user.physicalStat.weightRecords.slice(-1)[0];
      if (latestWeightRecord?.date.toISOString().split('T')[0] === today) {
        latestWeightRecord.weight = physicalStats.weightRecords[0].weight;
      } else {
        user.physicalStat.weightRecords.push({
          weight: physicalStats.weightRecords[0].weight,
          date: new Date(),
        });
      }
    }
    await user.save();

    return user.physicalStat;
  }

  async getPhysicalStats(userId: string) {
    return this.repository.getPhysicalStats(userId);
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

  async getNutritionTarget(userId: string) {
    const user = await this.repository.getById(userId, { nutritionGoals: 1 });
    return user?.nutritionGoals ?? null;
  }

  async updateNutritionTarget(
    userId: string,
    nutritionGoals: Partial<User['nutritionGoals']>,
  ) {
    const user = await this.repository.update(
      userId,
      { nutritionGoals },
      { nutritionGoals: 1 },
    );

    return user?.nutritionGoals ?? null;
  }
}

export default new UserService();
