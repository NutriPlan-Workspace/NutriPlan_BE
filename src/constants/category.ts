import { CategoryGroup } from '@/types/category.types';

export const CATEGORIES_BY_GROUP: CategoryGroup = [
  {
    group: 'Common Exclusions',
    mainItem: undefined,
    items: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    group: 'Dairy',
    mainItem: 5,
    items: [8, 9, 10, 11, 12, 13],
  },
  {
    group: 'Eggs',
    mainItem: undefined,
    items: [2],
  },
  {
    group: 'Grains',
    mainItem: 14,
    items: [15, 16, 17, 18, 19, 20],
  },
  {
    group: 'Soy',
    mainItem: 6,
    items: [21, 22],
  },
  {
    group: 'Red Meat',
    mainItem: 23,
    items: [24, 25, 26, 27],
  },
  {
    group: 'Poultry',
    mainItem: 28,
    items: [29, 30],
  },
  {
    group: 'Fish',
    mainItem: 3,
    items: [31, 32, 33, 34, 35],
  },
  {
    group: 'Shellfish',
    mainItem: undefined,
    items: [7],
  },
  {
    group: 'Mayo',
    mainItem: undefined,
    items: [36],
  },
  {
    group: 'Fats & Nuts',
    mainItem: 37,
    items: [38, 39, 40, 41],
  },
  {
    group: 'Legumes',
    mainItem: 42,
    items: [43, 44, 45],
  },
  {
    group: 'Fruits',
    mainItem: 46,
    items: [47, 48, 49, 50, 51, 52, 53],
  },
  {
    group: 'Fruit Juice',
    mainItem: undefined,
    items: [54],
  },
  {
    group: 'Vegetables',
    mainItem: 55,
    items: [56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
  },
  {
    group: 'Starchy Vegetables',
    mainItem: 66,
    items: [67, 68],
  },
  {
    group: 'Honey',
    mainItem: undefined,
    items: [69],
  },
  {
    group: 'More',
    mainItem: undefined,
    items: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  },
] as const;

export const MAIN_ITEM_CATEGORIES = CATEGORIES_BY_GROUP.reduce<Set<number>>(
  (mainItemSet, category) => {
    if (category.mainItem !== undefined) {
      mainItemSet.add(category.mainItem);
    }
    return mainItemSet;
  },
  new Set<number>(),
);

export const EXCLUDED_BY_DIET = {
  anything: [],
  keto: [14, 42, 66, 55],
  mediterranean: [23, 54, 66],
  paleo: [5, 14, 43, 6, 67],
  vegan: [23, 28, 3, 7, 5, 2, 36, 69],
  vegetarian: [23, 28, 3, 7],
};
