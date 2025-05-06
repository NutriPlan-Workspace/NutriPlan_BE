import { UserModel } from '@/models';
import { ActivityLevel, BodyFat, Gender, type User } from '@/types';

import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  async getPhysicalStats(userId: string) {
    const user = await this.getById(userId);
    return user?.physicalStat
      ? user.physicalStat
      : {
          gender: Gender.MALE,
          heightRecords: [],
          weightRecords: [],
          dateOfBirth: new Date(),
          bodyFat: BodyFat.LOW,
          activityLevel: ActivityLevel.SEDENTARY,
        };
  }
  async updatePhysicalStats(
    userId: string,
    physicalStats: Partial<User['physicalStat']>,
  ) {
    return this.update(userId, { physicalStat: physicalStats });
  }
}
