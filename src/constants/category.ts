import { CategoryGroup } from '@/types/category.types';

export const CATEGORIES_BY_GROUP: CategoryGroup = [
  {
    group: 'Common Allergens',
    mainItem: undefined,
    items: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    group: 'Frequently Excluded',
    mainItem: undefined,
    items: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  {
    group: 'Dairy',
    mainItem: 0,
    items: [21, 22, 23, 24, 25, 26, 27, 28, 29],
  },
  {
    group: 'Red Meat',
    mainItem: 30,
    items: [31, 32, 33, 34],
  },
  {
    group: 'Poultry',
    mainItem: 35,
    items: [36, 37, 38],
  },
  {
    group: 'Fish',
    mainItem: 2,
    items: [39, 40, 41, 42, 43, 44],
  },
  {
    group: 'Shellfish',
    mainItem: 6,
    items: [45, 46, 47, 48, 49, 50, 51, 52],
  },
  {
    group: 'Vegetables',
    mainItem: 53,
    items: [
      54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
      72, 73, 74, 75,
    ],
  },
  {
    group: 'Fruit',
    mainItem: 76,
    items: [
      77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
    ],
  },
  {
    group: 'Soy',
    mainItem: 7,
    items: [95, 96, 97, 98, 99],
  },
  {
    group: 'Grains',
    mainItem: 100,
    items: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
  },
  {
    group: 'Legumes',
    mainItem: 111,
    items: [112, 113, 114, 115],
  },
  {
    group: 'Tree Nuts',
    mainItem: 8,
    items: [116, 117, 118, 119, 120, 121, 122],
  },
  {
    group: 'Condiments',
    mainItem: undefined,
    items: [20, 123, 124, 125, 126, 127, 128, 129, 97],
  },
  {
    group: 'Sweets',
    mainItem: 130,
    items: [9, 20, 124, 82, 92],
  },
  {
    group: 'Others',
    mainItem: undefined,
    items: [131, 132, 133, 134, 135, 136],
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
  // Grains,  Legumes, Sweets
  keto: [],
  // Red Meat, Fruit juice, Starchy Vegetables
  mediterranean: [30, 31, 32, 33, 34, 76, 77, 78, 79, 80, 81, 82],
  // Dairy, Grains, Legumes, Soy, Starchy Vegetables
  paleo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 100, 101, 102, 103, 104, 105, 106],
  vegan: [],
  vegetarian: [],
};
