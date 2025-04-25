import { ActivityLevel, Gender, NutritionGoals } from '@/types';

export const calculateBMR = (
  gender: Gender,
  age: number,
  height: number,
  weight: number,
) => {
  if (gender === Gender.FEMALE) {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel) => {
  let multiplier = 1;

  switch (activityLevel) {
    case ActivityLevel.SEDENTARY:
      multiplier = 1.2;
      break;
    case ActivityLevel.LIGHT:
      multiplier = 1.375;
      break;
    case ActivityLevel.MODERATE:
      multiplier = 1.55;
      break;
    case ActivityLevel.ACTIVE:
      multiplier = 1.725;
      break;
    case ActivityLevel.VERY_ACTIVE:
      multiplier = 1.9;
      break;
  }

  return bmr * multiplier;
};

export const calculateAge = (date: Date) => {
  const age = new Date().getFullYear() - date.getFullYear();
  return age === 0 ? 1 : age;
};

export const applyGoalToTDEE = (tdee: number, goalType: NutritionGoals) => {
  switch (goalType) {
    case NutritionGoals.LOSE_FAT:
      return Math.round(tdee * 0.8);
    case NutritionGoals.MAINTAIN_WEIGHT:
      return Math.round(tdee);
    case NutritionGoals.BUILD_MUSCLE:
      return Math.round(tdee * 1.15);
  }
};
