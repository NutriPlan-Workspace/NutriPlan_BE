import { UserModel } from '@/models';
import type { User } from '@/types';

import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  async getPhysicalStats(userId: string) {
    const user = await this.getById(userId);
    return user ? user.physicalStat : null;
  }

  async updatePhysicalStats(
    userId: string,
    physicalStats: Partial<User['physicalStat']>,
  ) {
    return this.update(userId, { physicalStat: physicalStats });
  }
}
