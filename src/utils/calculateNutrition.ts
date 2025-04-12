import { ActivityLevel, Gender } from '@/types';

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

export const calculateAge = (date: Date) =>
  new Date().getFullYear() - date.getFullYear();
