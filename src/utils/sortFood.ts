import { Food } from '@/types';

export function compareFood(a: Food, b: Food): number {
  const fields = ['calories', 'carbs', 'fats', 'proteins'] as const;

  for (const field of fields) {
    const aValue = a.nutrition[field];
    const bValue = b.nutrition[field];

    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }

  return 0;
}

export function compareFoodReverse(a: Food, b: Food): number {
  const fields = ['calories', 'carbs', 'fats', 'proteins'] as const;

  for (const field of fields) {
    const aValue = a.nutrition[field];
    const bValue = b.nutrition[field];

    if (aValue !== bValue) {
      return bValue - aValue;
    }
  }

  return 0;
}
