import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import {
  ActivityLevel,
  BodyFat,
  Gender,
  NutritionGoals,
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
        gender: { type: String, enum: Object.values(Gender) },
        heightRecords: [
          {
            date: { type: Date, default: Date.now },
            height: { type: Number, required: true },
          },
        ],
        weightRecords: [
          {
            date: { type: Date, default: Date.now },
            weight: { type: Number, required: true },
          },
        ],
        dateOfBirth: { type: Date },
        bodyFat: { type: String, enum: Object.values(BodyFat) },
        activityLevel: {
          type: String,
          enum: Object.values(ActivityLevel),
        },
        time: { type: Date, default: Date.now },
      },
      required: false,
    },
    excluded: {
      type: {
        categories: [{ type: Number }],
        foods: [{ foodId: { type: Schema.Types.ObjectId } }],
      },
      required: false,
    },
    nutritionGoals: {
      type: {
        title: { type: String },
        calories: { type: Number },
        proteinTarget: {
          from: { type: Number },
          to: { type: Number },
        },
        carbTarget: {
          from: { type: Number },
          to: { type: Number },
        },
        fatTarget: {
          from: { type: Number },
          to: { type: Number },
        },
        minimumFiber: { type: Number },
        maxiumSodium: { type: Number },
        maxiumCholesterol: { type: Number },
        goalType: {
          type: String,
          enum: Object.values(NutritionGoals),
          default: NutritionGoals.LOSE_FAT,
        },
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
) as SoftDeleteModel<User> & PaginateModel<User>;

export default UserModel;
