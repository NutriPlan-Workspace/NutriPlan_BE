export const FOOD_TYPES = ['customFood', 'customRecipe', 'create'] as const;

export type FoodType = (typeof FOOD_TYPES)[number];
