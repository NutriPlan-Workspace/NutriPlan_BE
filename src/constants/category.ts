import { CategoryGroup } from '@/types/category.types';

export const FOOD_CATEGORIES = [
  // Common Allergens
  { label: 'Dairy', value: 0 },
  { label: 'Eggs', value: 1 },
  { label: 'Fish', value: 2 },
  { label: 'Gluten', value: 3 },
  { label: 'Peanuts', value: 4 },
  { label: 'Sesame', value: 5 },
  { label: 'Shellfish', value: 6 },
  { label: 'Soy', value: 7 },
  { label: 'Tree Nuts', value: 8 },

  // Frequently Excluded
  { label: 'Chocolate', value: 9 },
  { label: 'Cilantro', value: 10 },
  { label: 'Kale', value: 11 },
  { label: 'Mayonnaise', value: 12 },
  { label: 'Mushrooms', value: 13 },
  { label: 'Mustard', value: 14 },
  { label: 'Olives', value: 15 },
  { label: 'Onions', value: 16 },
  { label: 'Pickles', value: 17 },
  { label: 'Protein Powder', value: 18 },
  { label: 'Shakes & Smoothies', value: 19 },
  { label: 'Sugar', value: 20 },

  // Dairy
  { label: 'Blue Cheese', value: 21 },
  { label: 'Butter', value: 22 },
  { label: 'Cheese', value: 23 },
  { label: 'Cottage Cheese', value: 24 },
  { label: 'Cream', value: 25 },
  { label: 'Goat Cheese', value: 26 },
  { label: 'Milk', value: 27 },
  { label: 'Whey Powder', value: 28 },
  { label: 'Yogurt', value: 29 },

  // Red Meat
  { label: 'Red Meat', value: 30 },
  { label: 'Beef', value: 31 },
  { label: 'Lamb', value: 32 },
  { label: 'Pork & Bacon', value: 33 },
  { label: 'Sausages and Luncheon Meats', value: 34 },

  // Poultry
  { label: 'Poultry', value: 35 },
  { label: 'Chicken', value: 36 },
  { label: 'Duck', value: 37 },
  { label: 'Turkey', value: 38 },

  // Fish
  { label: 'Cod', value: 39 },
  { label: 'Salmon', value: 40 },
  { label: 'Sardines', value: 41 },
  { label: 'Tilapia', value: 42 },
  { label: 'Trout & Snapper', value: 43 },
  { label: 'Tuna', value: 44 },

  // Shellfish
  { label: 'Clams', value: 45 },
  { label: 'Crab', value: 46 },
  { label: 'Lobster', value: 47 },
  { label: 'Mussels', value: 48 },
  { label: 'Oysters', value: 49 },
  { label: 'Scallops', value: 50 },
  { label: 'Shrimp', value: 51 },
  { label: 'Squid', value: 52 },

  // Vegetables
  { label: 'Vegetables', value: 53 },
  { label: 'Artichoke', value: 54 },
  { label: 'Arugula', value: 55 },
  { label: 'Asparagus', value: 56 },
  { label: 'Beets', value: 57 },
  { label: 'Bell Peppers', value: 58 },
  { label: 'Broccoli', value: 59 },
  { label: 'Brussel Sprouts', value: 60 },
  { label: 'Cabbage', value: 61 },
  { label: 'Carrots', value: 62 },
  { label: 'Cauliflower', value: 63 },
  { label: 'Celery', value: 64 },
  { label: 'Chili Peppers', value: 65 },
  { label: 'Cucumber', value: 66 },
  { label: 'Eggplant', value: 67 },
  { label: 'Garlic', value: 68 },
  { label: 'Lettuce', value: 69 },
  { label: 'Potatoes & Yams', value: 70 },
  { label: 'Radish', value: 71 },
  { label: 'Spinach', value: 72 },
  { label: 'Squash', value: 73 },
  { label: 'Tomato', value: 74 },
  { label: 'Zucchini', value: 75 },

  // Fruit
  { label: 'Fruit', value: 76 },
  { label: 'Apple', value: 77 },
  { label: 'Avocado', value: 78 },
  { label: 'Banana', value: 79 },
  { label: 'Blueberries', value: 80 },
  { label: 'Coconut', value: 81 },
  { label: 'Dates', value: 82 },
  { label: 'Grapes', value: 83 },
  { label: 'Kiwi', value: 84 },
  { label: 'Lemon', value: 85 },
  { label: 'Lime', value: 86 },
  { label: 'Mango', value: 87 },
  { label: 'Melon', value: 88 },
  { label: 'Orange', value: 89 },
  { label: 'Peaches & Plums', value: 90 },
  { label: 'Pineapple', value: 91 },
  { label: 'Raisins', value: 92 },
  { label: 'Raspberries', value: 93 },
  { label: 'Strawberries', value: 94 },

  // Soy
  { label: 'Edamame', value: 95 },
  { label: 'Soy Milk', value: 96 },
  { label: 'Soy Sauce', value: 97 },
  { label: 'Tempeh', value: 98 },
  { label: 'Tofu', value: 99 },

  // Grains
  { label: 'Grains', value: 100 },
  { label: 'Barley', value: 101 },
  { label: 'Bread', value: 102 },
  { label: 'Breakfast Cereals', value: 103 },
  { label: 'Corn', value: 104 },
  { label: 'Oats', value: 105 },
  { label: 'Pastas', value: 106 },
  { label: 'Quinoa', value: 107 },
  { label: 'Rice', value: 108 },
  { label: 'Rye', value: 109 },
  { label: 'Wheat', value: 110 },

  // Legumes
  { label: 'Legumes', value: 111 },
  { label: 'Beans', value: 112 },
  { label: 'Chickpeas', value: 113 },
  { label: 'Hummus', value: 114 },
  { label: 'Lentils', value: 115 },

  // Tree Nuts
  { label: 'Almonds', value: 116 },
  { label: 'Brazil Nuts', value: 117 },
  { label: 'Cashews', value: 118 },
  { label: 'Hazelnuts', value: 119 },
  { label: 'Pecans', value: 120 },
  { label: 'Pistachios', value: 121 },
  { label: 'Walnuts', value: 122 },

  // Condiments
  { label: 'Fish Sauce', value: 123 },
  { label: 'Honey', value: 124 },
  { label: 'Ketchup', value: 125 },
  { label: 'Mayonnaise', value: 126 },
  { label: 'Mustard', value: 127 },
  { label: 'Pickles', value: 128 },
  { label: 'Spices and Herbs', value: 129 },

  // Sweets
  { label: 'Sweets', value: 130 },

  // Others
  { label: 'Soups, Sauces, and Gravies', value: 131 },
  { label: 'Baked Products', value: 132 },
  { label: 'Beverages', value: 133 },
  { label: 'Fast Foods', value: 134 },
  { label: 'Ethnic Foods', value: 135 },
  { label: 'Supplements', value: 136 },
] as const;

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
  keto: [
    3, 20, 57, 61, 62, 70, 76, 79, 80, 83, 87, 88, 89, 90, 91, 92, 93, 94, 100,
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
    130, 133,
  ],
  mediterranean: [20, 22, 25, 28, 30, 31, 32, 33, 34, 130, 132, 134, 136],
  paleo: [
    0, 7, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 95, 96, 97, 98, 99,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
    115, 125, 126, 127, 128, 129, 130, 136,
  ],
  vegan: [
    0, 1, 2, 6, 18, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 123,
    124,
  ],
  vegetarian: [
    2, 6, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
    47, 48, 49, 50, 51, 52, 123,
  ],
};
