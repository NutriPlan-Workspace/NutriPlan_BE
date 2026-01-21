import { UserRepository } from '@/repositories/user.repository';
import { ActivityLevel, BodyFat, Gender, type User } from '@/types';
import {
  applyGoalToTDEE,
  calculateAge,
  calculateBMR,
  calculateTDEE,
} from '@/utils/calculateNutrition';
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

  async adminListUsers(params: { page: number; limit: number; q?: string }) {
    const { page, limit, q } = params;
    const query = q
      ? {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const options = {
      page,
      limit,
      select: '-password',
      sort: { createdAt: -1 },
    };

    return this.repository.paginate(query, options);
  }

  async updatePhysicalStats(
    userId: string,
    physicalStats: Partial<User['physicalStat']>,
  ) {
    const user = await this.repository.getById(userId);
    if (!user) {
      return null;
    }

    user.physicalStat ||= {
      gender: Gender.MALE,
      heightRecords: [],
      weightRecords: [],
      dateOfBirth: new Date(),
      bodyFat: BodyFat.LOW,
      activityLevel: ActivityLevel.SEDENTARY,
      time: new Date(),
    };

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
    const excludedKeys = ['heightRecords', 'weightRecords'];

    Object.entries(physicalStats).forEach(([key, value]) => {
      if (!excludedKeys.includes(key) && value !== undefined) {
        (user.physicalStat as Record<string, unknown>)[key] = value;
      }
    });
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

  async getCaloriesByStats(userId: string): Promise<{
    calories: number;
    proteinTarget: { from: number; to: number };
    carbTarget: { from: number; to: number };
    fatTarget: { from: number; to: number };
  } | null> {
    const user = await this.repository.getById(userId, {
      physicalStat: 1,
      nutritionGoals: 1,
    });

    if (!user || !user.physicalStat) return null;

    const sex = user.physicalStat.gender;
    const age = calculateAge(user.physicalStat.dateOfBirth);

    const latestHeight = user.physicalStat.heightRecords.at(-1)?.height;
    const latestWeight = user.physicalStat.weightRecords.at(-1)?.weight;

    if (!latestHeight || !latestWeight) return null;

    const bmr = calculateBMR(sex, age, latestHeight, latestWeight);
    let tdee = calculateTDEE(bmr, user.physicalStat.activityLevel);
    if (user?.nutritionGoals?.goalType) {
      tdee = applyGoalToTDEE(tdee, user.nutritionGoals.goalType);
    }
    const proteinTarget = {
      from: Math.round((tdee * 0.1) / 4),
      to: Math.round((tdee * 0.35) / 4),
    };

    const carbTarget = {
      from: Math.round((tdee * 0.45) / 4),
      to: Math.round((tdee * 0.65) / 4),
    };

    const fatTarget = {
      from: Math.round((tdee * 0.2) / 9),
      to: Math.round((tdee * 0.35) / 9),
    };

    return {
      calories: tdee,
      proteinTarget,
      carbTarget,
      fatTarget,
    };
  }

  async getPrimaryDiet(userId: string) {
    const user = await this.repository.getById(userId);
    return user?.primaryDiet ?? null;
  }

  async updatePrimaryDiet(userId: string, primaryDiet: string) {
    const user = await this.repository.update(userId, { primaryDiet });
    return user?.primaryDiet ?? null;
  }

  async getFoodExclusions(userId: string) {
    const user = await this.repository.getById(userId, { excluded: 1 });
    return user?.excluded ?? null;
  }

  async updateFoodExclusions(
    userId: string,
    excluded: Partial<User['excluded']>,
  ) {
    const user = await this.repository.update(userId, { excluded });
    return user?.excluded ?? null;
  }
}

export default new UserService();
