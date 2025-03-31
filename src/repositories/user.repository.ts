import type { User } from '@/types';

import { UserModel } from '../models';

import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }
}
