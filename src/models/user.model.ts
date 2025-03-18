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
    phoneNumber: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    refreshToken: { type: String, required: false },
    physicalStat: {
      type: {
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
      required: false,
    },
    excluded: {
      type: {
        categories: [{ categoryId: { type: Schema.Types.ObjectId } }],
        foods: [{ foodId: { type: Schema.Types.ObjectId } }],
      },
      required: false,
    },
    nutritionGoals: {
      type: {
        title: { type: String },
        caloriesLimit: { type: Number },
        proteinTarget: { type: Number },
        carbTarget: { type: Number },
        fatTarget: { type: Number },
        minimumFiber: { type: Number },
      },
      required: false,
    },
    primaryDiet: {
      type: String,
      enum: Object.values(PrimaryDiet),
      required: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  { timestamps: true, autoCreate: true },
);

UserSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: true });
UserSchema.plugin(paginate);

export const UserModel = model<User>(
  'User',
  UserSchema,
) as SoftDeleteModel<User>;

export default UserModel;
