export const VALID_FILTERS = [
  'basicFood',
  'recipe',
  'customFood',
  'customRecipe',
  'collectionFoods',
  'favorites',
] as const;

export const IGNORED_FILTERS = ['collectionFoods', 'favorites'] as const;

export type IgnoredFilter = (typeof IGNORED_FILTERS)[number];

export type ValidFilter = (typeof VALID_FILTERS)[number];

export type ActiveFilter = Exclude<ValidFilter, IgnoredFilter>;

export const isActiveFilter = (val: string): val is ActiveFilter =>
  VALID_FILTERS.includes(val as ValidFilter) &&
  !IGNORED_FILTERS.includes(val as IgnoredFilter);

export const PREFERRED_FOOD_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
] as const;

export type PreferredFoodType = (typeof PREFERRED_FOOD_TYPES)[number];

export const DISH_TYPES = ['main', 'side'] as const;

export type DishType = (typeof DISH_TYPES)[number];
