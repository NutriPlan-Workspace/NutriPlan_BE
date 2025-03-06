import { model, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import {
  ActivityLevel,
  BodyFat,
  Gender,
  PrimaryDiet,
  User,
  UserRole,
} from '@/types';

const UserSchema = new Schema<User>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    physicalStat: {
      gender: { type: String, enum: Object.values(Gender), required: true },
      height: { type: Number, required: true },
      weight: { type: Number, required: true },
      dateOfBirth: { type: Date, required: true },
      bodyFat: { type: String, enum: Object.values(BodyFat), required: true },
      activityLevel: {
        type: String,
        enum: Object.values(ActivityLevel),
        required: true,
      },
      time: { type: Date, default: Date.now },
    },
    excluded: {
      categories: [
        { categoryId: { type: Schema.Types.ObjectId, required: true } },
      ],
      foods: [{ foodId: { type: Schema.Types.ObjectId, required: true } }],
    },
    nutritionGoals: {
      title: { type: String, required: true },
      caloriesLimit: { type: Number, required: true },
      proteinTarget: { type: Number, required: true },
      carbTarget: { type: Number, required: true },
      fatTarget: { type: Number, required: true },
      minimumFiber: { type: Number, required: true },
    },
    primaryDiet: {
      type: String,
      enum: Object.values(PrimaryDiet),
      required: true,
    },
    role: { type: String, enum: Object.values(UserRole), required: true },
  },
  { timestamps: true, autoCreate: true },
);

UserSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: true });
UserSchema.plugin(paginate);

export const UserModel = model<User>(
  'User',
  UserSchema,
) as SoftDeleteModel<User>;
