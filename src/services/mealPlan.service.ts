import _ from 'lodash';
import { FilterQuery, Schema, Types } from 'mongoose';

import { CATEGORIES_BY_GROUP, EXCLUDED_BY_DIET } from '@/constants/category';
import { PantryModel } from '@/models';
import { CollectionRepository } from '@/repositories/collection.repository';
import { FoodRepository } from '@/repositories/food.repository';
import { MealPlanRepository } from '@/repositories/mealPlan.repository';
import { UserRepository } from '@/repositories/user.repository';
import type {
  MealPlanPreferences,
  MealPlanSwapApplyInput,
  MealPlanSwapOptionsInput,
} from '@/schemas/mealPlan.schema';
import type {
  ExtendedNutritionGoals,
  Food,
  MealPlan,
  NutritionGoalsType,
  PopulatedMealItemIngre,
  PopulatedMealPlanIngre,
} from '@/types';
import type {
  GeneratedMealPlan,
  MealPlanForUser,
} from '@/types/mealPlan.types';
import { ChooseMeal, SCORE_WEIGHTS, ScoringContext } from '@/utils/chooseMeal';
import { getWeekRange } from '@/utils/date';

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealType = 'breakfast' | 'lunch' | 'dinner';

type FoodForSwap = Pick<
  Food,
  '_id' | 'nutrition' | 'units' | 'defaultUnit' | 'property' | 'categories'
>;

type FoodSwapOptionCandidate = {
  foodId: string;
  amount: number;
  unit: number;
  nutrition: MacroTotals;
  food: FoodForSwap;
  score: number;
};

class MealPlanService {
  private mealPlanRepository: MealPlanRepository;
  private userRepository: UserRepository;
  private foodRepository: FoodRepository;
  private collectionRepository: CollectionRepository;
  private chooseMeal: ChooseMeal;

  constructor() {
    this.mealPlanRepository = new MealPlanRepository();
    this.userRepository = new UserRepository();
    this.foodRepository = new FoodRepository();
    this.collectionRepository = new CollectionRepository();
    this.chooseMeal = new ChooseMeal();
  }

  private getDayBounds(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  private async getRecurringFoodsForDate(
    userId: string,
    date: Date,
    excludedFoodIds: Set<string>,
  ): Promise<Food[]> {
    const collections = await this.collectionRepository.getList(
      { userId, isRecurring: true },
      {},
      undefined,
      'foods.food',
    );

    if (!collections.length) return [];

    const matchingCollections = collections.filter((collection) => {
      if (!collection.recurringFrequency) return false;
      const start = collection.recurringStartDate
        ? new Date(collection.recurringStartDate)
        : new Date(collection.createdAt ?? new Date());

      if (collection.recurringFrequency === 'daily') return true;
      if (collection.recurringFrequency === 'weekly') {
        return start.getDay() === date.getDay();
      }
      if (collection.recurringFrequency === 'monthly') {
        return start.getDate() === date.getDate();
      }
      return false;
    });

    const foodIds = new Set<string>();
    matchingCollections.forEach((collection) => {
      collection.foods?.forEach((item) => {
        const foodId = (item as { food?: { _id?: Types.ObjectId } })?.food?._id;
        if (foodId) {
          const id = foodId.toString();
          if (!excludedFoodIds.has(id)) {
            foodIds.add(id);
          }
        }
      });
    });

    if (foodIds.size === 0) return [];

    return this.foodRepository.getList(
      { _id: { $in: Array.from(foodIds) }, deleted: false },
      {},
      { limit: 300 },
    );
  }

  async getMealPlanByDate(date: Date, userId: string) {
    const { start, end } = this.getDayBounds(date);
    return await this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: { $gte: start, $lte: end },
    });
  }

  async getLatestMealPlan(date: Date, userId: string) {
    return await this.mealPlanRepository.getLatestMealPlan(date, userId);
  }

  async getMealPlanByRange(from: Date, to: Date, userId: string) {
    const { start: fromStart } = this.getDayBounds(from);
    const { end: toEnd } = this.getDayBounds(to);
    return this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: { $gte: fromStart, $lte: toEnd },
    });
  }

  async getMealPlanByWeek(date: Date, userId: string) {
    const { startOfWeek, endOfWeek } = getWeekRange(new Date(date));
    return this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: { $gte: startOfWeek, $lte: endOfWeek },
    });
  }

  async addFoodToMealPlan(mealItem: MealPlan, userId: string) {
    return this.mealPlanRepository.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate: mealItem.mealDate,
      mealItems: {
        breakfast: mealItem.mealItems.breakfast || [],
        lunch: mealItem.mealItems.lunch || [],
        dinner: mealItem.mealItems.dinner || [],
      },
    });
  }

  async editDayMealPlan(mealPlanId: string, mealPlanData: Partial<MealPlan>) {
    const mealPlan = await this.mealPlanRepository.getById(mealPlanId);
    if (!mealPlan) {
      return null;
    }
    const updatedMealPlan = await this.mealPlanRepository.update(mealPlanId, {
      mealItems: mealPlanData.mealItems,
    });
    return updatedMealPlan;
  }

  async removeMealPlan(mealPlanId: string) {
    const mealPlan = await this.mealPlanRepository.getById(mealPlanId);

    if (!mealPlan) return null;

    return this.mealPlanRepository.delete(mealPlanId);
  }

  async adminListMealPlans(params: {
    page: number;
    limit: number;
    userId?: string;
    from?: Date;
    to?: Date;
  }) {
    const { page, limit, userId, from, to } = params;
    const query: FilterQuery<MealPlan> = {};

    if (userId) {
      query.userId = new Types.ObjectId(
        userId,
      ) as unknown as Schema.Types.ObjectId;
    }

    if (from || to) {
      const fromDate = from ? this.getDayBounds(from).start : undefined;
      const toDate = to ? this.getDayBounds(to).end : undefined;
      query.mealDate = {
        ...(fromDate ? { $gte: fromDate } : {}),
        ...(toDate ? { $lte: toDate } : {}),
      };
    }

    return this.mealPlanRepository.paginate(query, {
      page,
      limit,
      sort: { mealDate: -1 },
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    });
  }

  async adminCreateMealPlan(input: {
    userId: string;
    mealDate: Date;
    mealItems?: MealPlan['mealItems'];
  }) {
    const { userId, mealDate, mealItems } = input;
    return this.mealPlanRepository.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate,
      mealItems: {
        breakfast: mealItems?.breakfast ?? [],
        lunch: mealItems?.lunch ?? [],
        dinner: mealItems?.dinner ?? [],
      },
    });
  }

  async adminUpdateMealPlan(
    mealPlanId: string,
    input: {
      mealDate?: Date;
      mealItems?: MealPlan['mealItems'];
    },
  ) {
    const updates: Partial<MealPlan> = {};
    if (input.mealDate) {
      updates.mealDate = input.mealDate;
    }
    if (input.mealItems) {
      updates.mealItems = input.mealItems;
    }

    return this.mealPlanRepository.update(mealPlanId, updates);
  }

  async getGroceries(mealPlanData: PopulatedMealPlanIngre[]) {
    const ingredientMap: Record<
      string,
      {
        name: string;
        categories?: number[];
        totalAmount: number;
        unit: {
          description: string;
          amount: number;
          // _id: string;
        };
        units: { amount: number; description: string }[];
        nutrition: {
          calories: number;
          carbs: number;
          fats: number;
          proteins: number;
          fiber: number;
          sodium: number;
          cholesterol: number;
        };
        ingredientId: string;
        imgUrls: string[];
        foodDetails: {
          name: string;
          date: string;
          imgUrls: string[];
          amount: number;
          description: string;
        }[];
      }
    > = {};

    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

    for (const plan of mealPlanData) {
      if (!plan) continue;

      const planDate = plan.mealDate;

      for (const mealType of mealTypes) {
        const mealItems = plan.mealItems[mealType] || [];

        for (const item of mealItems) {
          if (!item) continue;
          if (item.isEaten) continue;
          const ingredients = item.foodId?.ingredients || [];
          const check = item.unit === item.foodId.defaultUnit;

          for (const ing of ingredients) {
            const ingredient = ing.ingredientFoodId;

            if (!ingredient) continue;

            const key = ingredient._id.toString();
            const unitIndex = ing.unit;
            let ingredientAmount = ing.amount;

            const unit = ingredient.units[unitIndex];
            if (check) {
              ingredientAmount =
                (item.amount * ing.amount) /
                item.foodId.units[item.foodId.defaultUnit].amount;
            } else {
              ingredientAmount =
                (item.amount * ing.amount) /
                item.foodId.units[item.unit].amount;
            }
            if (!ingredientMap[key]) {
              const categories =
                Array.isArray(ingredient.categories) &&
                ingredient.categories.length > 0
                  ? ingredient.categories
                  : Array.isArray(item.foodId?.categories) &&
                      item.foodId.categories.length > 0
                    ? item.foodId.categories
                    : [136];
              ingredientMap[key] = {
                name: ingredient.name,
                categories,
                totalAmount: ingredientAmount,
                unit: unit,
                ingredientId: ingredient._id.toString(),
                imgUrls: ingredient.imgUrls || [],
                units: ingredient.units,
                nutrition: {
                  calories: ingredient.nutrition.calories,
                  carbs: ingredient.nutrition.carbs,
                  fats: ingredient.nutrition.fats || 0,
                  proteins: ingredient.nutrition.proteins,
                  fiber: ingredient.nutrition.fiber,
                  sodium: ingredient.nutrition.sodium,
                  cholesterol: ingredient.nutrition.cholesterol,
                },
                foodDetails: [
                  {
                    name: item.foodId.name,
                    date: planDate.toISOString(),
                    imgUrls: item.foodId.imgUrls,
                    amount: ingredientAmount,
                    description: ingredient.units[unitIndex].description,
                  },
                ],
              };
            } else {
              if (ingredientMap[key].unit.description === unit?.description) {
                ingredientMap[key].totalAmount += ingredientAmount;
              } else {
                ingredientMap[key].totalAmount +=
                  (ingredientAmount * ingredientMap[key].unit.amount) /
                  unit?.amount;
              }
              if (
                !ingredientMap[key].foodDetails.some(
                  (detail) =>
                    detail.name === item.foodId.name &&
                    detail.date === planDate.toISOString().split('T')[0],
                )
              ) {
                ingredientMap[key].foodDetails.push({
                  name: item.foodId.name,
                  date: planDate.toISOString(),
                  imgUrls: item.foodId.imgUrls,
                  amount: ingredientAmount,
                  description: ingredient.units[unitIndex].description,
                });
              }
            }
          }
        }
      }
    }

    return Object.values(ingredientMap);
  }

  private getServingSize(food: FoodForSwap, amount: number, unit: number) {
    const unitAmount =
      food.units?.[unit]?.amount ?? food.units?.[food.defaultUnit]?.amount ?? 1;
    if (!unitAmount || unitAmount <= 0) {
      return 0;
    }
    return amount / unitAmount;
  }

  private calculateItemNutrition(
    food: FoodForSwap,
    amount: number,
    unit: number,
  ): MacroTotals {
    const servings = this.getServingSize(food, amount, unit);
    // Convert Mongoose document to plain object if needed
    const nutrition =
      typeof (food as unknown as { toObject?: () => unknown }).toObject ===
      'function'
        ? (
            food as unknown as {
              toObject: () => { nutrition?: Record<string, number> };
            }
          ).toObject().nutrition
        : food.nutrition;
    const fats = (nutrition as Record<string, number>)?.fats ?? 0;
    return {
      calories:
        ((nutrition as Record<string, number>)?.calories ?? 0) * servings,
      protein:
        ((nutrition as Record<string, number>)?.proteins ?? 0) * servings,
      carbs: ((nutrition as Record<string, number>)?.carbs ?? 0) * servings,
      fat: fats * servings,
    };
  }

  private calculateMealNutrition(items: PopulatedMealItemIngre[]): MacroTotals {
    return items.reduce(
      (acc, item) => {
        const food = item.foodId;
        const totals = this.calculateItemNutrition(
          food,
          item.amount,
          item.unit,
        );
        acc.calories += totals.calories;
        acc.protein += totals.protein;
        acc.carbs += totals.carbs;
        acc.fat += totals.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  private addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
    return {
      calories: a.calories + b.calories,
      protein: a.protein + b.protein,
      carbs: a.carbs + b.carbs,
      fat: a.fat + b.fat,
    };
  }

  private normalizeRange(from: number, to: number) {
    return {
      from: Math.max(from, 0),
      to: Math.max(to, 0),
    };
  }

  private calculateRemainingTargets(
    preferences: NutritionGoalsType,
    mealItemsByType: PopulatedMealPlanIngre['mealItems'],
    mealType: MealType,
  ) {
    const otherTotals = (['breakfast', 'lunch', 'dinner'] as const)
      .filter((type) => type !== mealType)
      .reduce(
        (acc, type) => {
          const items = mealItemsByType?.[type] ?? [];
          const mealTotal = this.calculateMealNutrition(items);
          return this.addTotals(acc, mealTotal);
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

    const remainingCalories = preferences.calories - otherTotals.calories;
    const remainingProteinFrom =
      preferences.proteinTarget.from - otherTotals.protein;
    const remainingProteinTo =
      preferences.proteinTarget.to - otherTotals.protein;
    const remainingCarbFrom = preferences.carbTarget.from - otherTotals.carbs;
    const remainingCarbTo = preferences.carbTarget.to - otherTotals.carbs;
    const remainingFatFrom = preferences.fatTarget.from - otherTotals.fat;
    const remainingFatTo = preferences.fatTarget.to - otherTotals.fat;

    const remainingTargets: NutritionGoalsType = {
      calories: Math.max(remainingCalories, 0),
      proteinTarget: this.normalizeRange(
        remainingProteinFrom,
        remainingProteinTo,
      ),
      carbTarget: this.normalizeRange(remainingCarbFrom, remainingCarbTo),
      fatTarget: this.normalizeRange(remainingFatFrom, remainingFatTo),
    };

    const hasInsufficientRemaining =
      remainingCalories <= 0 ||
      remainingProteinTo <= 0 ||
      remainingCarbTo <= 0 ||
      remainingFatTo <= 0;

    return { remainingTargets, hasInsufficientRemaining };
  }

  private buildNutritionGoalsFromTotals(
    totals: MacroTotals,
  ): NutritionGoalsType {
    return {
      calories: totals.calories,
      proteinTarget: { from: totals.protein, to: totals.protein },
      carbTarget: { from: totals.carbs, to: totals.carbs },
      fatTarget: { from: totals.fat, to: totals.fat },
    };
  }

  private scoreTotals(target: MacroTotals, candidate: MacroTotals) {
    const safe = (value: number) => (value > 0 ? value : 1);
    return (
      Math.abs(candidate.calories - target.calories) / safe(target.calories) +
      Math.abs(candidate.protein - target.protein) / safe(target.protein) +
      Math.abs(candidate.carbs - target.carbs) / safe(target.carbs) +
      Math.abs(candidate.fat - target.fat) / safe(target.fat)
    );
  }

  private roundAmount(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  }

  private async getExcludedData(userId: string) {
    const excludedCategorySet = new Set<number>();
    const excludedFoodSet = new Set<string>();

    const user = await this.userRepository.getById(userId, {
      excluded: 1,
      primaryDiet: 1,
    });

    if (Array.isArray(user?.excluded?.categories)) {
      user.excluded.categories.forEach((catId) =>
        excludedCategorySet.add(catId),
      );
    }

    if (Array.isArray(user?.excluded?.foods)) {
      user.excluded.foods.forEach((food) => {
        let foodId: string | undefined;
        if (typeof food === 'string') {
          foodId = food;
        } else if (food instanceof Types.ObjectId) {
          foodId = food.toString();
        } else {
          foodId = (food as { foodId?: Types.ObjectId }).foodId?.toString();
        }
        if (foodId) {
          excludedFoodSet.add(foodId);
        }
      });
    }

    const exclusionCollections = await this.collectionRepository.getList(
      { userId, isExclusions: true },
      undefined,
      { limit: 1 },
      'foods.food',
    );

    exclusionCollections.forEach((collection) => {
      collection.foods?.forEach((item) => {
        const foodId = (item as { food?: { _id?: Types.ObjectId } })?.food?._id;
        if (foodId) excludedFoodSet.add(foodId.toString());
      });
    });

    if (user?.primaryDiet && user.primaryDiet in EXCLUDED_BY_DIET) {
      const dietExcluded =
        EXCLUDED_BY_DIET[user.primaryDiet as keyof typeof EXCLUDED_BY_DIET];

      dietExcluded.forEach((mainItemId) => {
        excludedCategorySet.add(mainItemId);

        const group = CATEGORIES_BY_GROUP.find(
          (group) => group.mainItem === mainItemId,
        );
        if (group) {
          group.items.forEach((itemId) => excludedCategorySet.add(itemId));
        }
      });
    }

    return {
      excludedCategoryIds: excludedCategorySet,
      excludedFoodIds: excludedFoodSet,
    };
  }

  private buildCategorySets(
    items: PopulatedMealItemIngre[],
    excludedCategoryIds: Set<number>,
  ) {
    const allCategories = new Set<number>();
    const mainCategories = new Set<number>();
    const sideCategories = new Set<number>();

    for (const item of items) {
      const categories = item.foodId?.categories ?? [];
      for (const category of categories) {
        allCategories.add(category);
        if (item.foodId?.property?.mainDish) {
          mainCategories.add(category);
        }
        if (item.foodId?.property?.sideDish) {
          sideCategories.add(category);
        }
      }
    }

    const defaultCategories = _.range(1, 137).filter(
      (id) => !excludedCategoryIds.has(id),
    );

    const pickCategories = (source: Set<number>) => {
      const selected = Array.from(source).filter(
        (id) => !excludedCategoryIds.has(id),
      );
      if (selected.length > 0) return selected;

      const fallback = Array.from(allCategories).filter(
        (id) => !excludedCategoryIds.has(id),
      );
      if (fallback.length > 0) return fallback;

      return defaultCategories.length > 0 ? defaultCategories : _.range(1, 137);
    };

    return {
      mainCategories: pickCategories(mainCategories),
      sideCategories: pickCategories(sideCategories),
    };
  }

  private findMealItemIndex(
    items: Array<{ foodId: unknown; _id?: unknown }>,
    targetFoodId?: string,
    targetItemId?: string,
  ) {
    if (targetItemId) {
      const index = items.findIndex(
        (item) => (item._id as Types.ObjectId)?.toString() === targetItemId,
      );
      if (index >= 0) return index;
    }

    if (targetFoodId) {
      return items.findIndex((item) => {
        const populatedId = (item.foodId as { _id?: Types.ObjectId })?._id;
        const foodId =
          populatedId?.toString() ??
          (item.foodId as Types.ObjectId)?.toString();
        return foodId === targetFoodId;
      });
    }

    return -1;
  }

  private async getSimilarFoods(
    targetFood: FoodForSwap,
    mealType: MealType,
    excludedCategoryIds: Set<number>,
    excludedFoodIds: Set<string>,
    limit: number,
    tolerance: number,
    searchQuery?: string,
  ) {
    const excludeIds = new Set<string>(excludedFoodIds);
    excludeIds.add(targetFood._id.toString());

    let baseQuery: FilterQuery<Food> = {
      deleted: false,
      _id: { $nin: Array.from(excludeIds) },
    };

    if (searchQuery) {
      // If searching, we prioritize the search term and ignore other filters if needed,
      // or we keep them loose. For a explicit search, we usually want to find the item
      // regardless of strict nutrition matching, but we still need it to be a food.
      const regex = { $regex: searchQuery, $options: 'i' };

      // Find potential ingredients that match the name
      // We limit this lookup to avoid performance issues
      const matchingIngredients = await this.foodRepository.getList(
        { name: regex },
        { _id: 1 },
        { limit: 50 },
      );
      const matchingIds = matchingIngredients.map((f) => f._id);

      const nameOrIngredientQuery = {
        $or: [
          { name: regex },
          { 'ingredients.ingredientFoodId': { $in: matchingIds } },
        ],
      };

      // Merge into baseQuery
      baseQuery = { ...baseQuery, ...nameOrIngredientQuery };

      // When searching, we skip the complex tiered nutrition/category logic
      // and just return the search results (up to limit).
      // We might want to respect dishType if strongly needed, but usually search overrides.
      return this.foodRepository.getList(baseQuery, undefined, { limit });
    }

    const categoryFilter = (useTargetCategories: boolean) => {
      const categories: Record<string, unknown> = {};
      if (useTargetCategories && targetFood.categories?.length) {
        categories.$in = targetFood.categories;
      }
      if (excludedCategoryIds.size > 0) {
        categories.$nin = Array.from(excludedCategoryIds);
      }
      return Object.keys(categories).length > 0 ? { categories } : {};
    };

    const nutritionFilters: Record<string, unknown> = {};
    const addRange = (field: string, value?: number) => {
      if (value && value > 0) {
        nutritionFilters[`nutrition.${field}`] = {
          $gte: value * (1 - tolerance),
          $lte: value * (1 + tolerance),
        };
      }
    };

    addRange('calories', targetFood.nutrition?.calories);
    addRange('proteins', targetFood.nutrition?.proteins);
    addRange('carbs', targetFood.nutrition?.carbs);
    addRange('fats', targetFood.nutrition?.fats);

    const dishTypeFilter: FilterQuery<Food> = {};
    if (targetFood.property?.mainDish) {
      dishTypeFilter['property.mainDish'] = true;
    } else if (targetFood.property?.sideDish) {
      dishTypeFilter['property.sideDish'] = true;
    }

    const mealTypeKey = `property.is${mealType
      .charAt(0)
      .toUpperCase()}${mealType.slice(1)}`;
    const mealTypeFilter = { [mealTypeKey]: true };

    const projection: Record<string, 0 | 1> = {
      name: 1,
      imgUrls: 1,
      nutrition: 1,
      defaultUnit: 1,
      units: 1,
      property: 1,
      categories: 1,
    };

    const queries: FilterQuery<Food>[] = [
      {
        ...baseQuery,
        ...nutritionFilters,
        ...categoryFilter(true),
        ...dishTypeFilter,
        ...mealTypeFilter,
      },
      {
        ...baseQuery,
        ...nutritionFilters,
        ...categoryFilter(true),
        ...dishTypeFilter,
      },
      {
        ...baseQuery,
        ...nutritionFilters,
        ...categoryFilter(false),
        ...dishTypeFilter,
      },
      {
        ...baseQuery,
        ...nutritionFilters,
        ...categoryFilter(false),
      },
    ];

    const candidateMap = new Map<string, Food>();
    const maxCandidates = Math.max(limit * 20, 200);

    for (const query of queries) {
      if (candidateMap.size >= maxCandidates) break;
      const foods = await this.foodRepository.getList(query, projection, {
        limit: maxCandidates,
      });
      for (const food of foods) {
        const id = food._id.toString();
        if (!candidateMap.has(id)) {
          candidateMap.set(id, food);
        }
      }
    }

    return Array.from(candidateMap.values());
  }

  async getSwapOptions(
    mealPlanId: string,
    userId: string,
    input: MealPlanSwapOptionsInput,
  ) {
    const mealPlans = await this.mealPlanRepository.getListPopulate({
      _id: mealPlanId,
      userId,
    });
    const mealPlan = mealPlans[0];
    if (!mealPlan) {
      return null;
    }

    const mealType = input.mealType;
    const mealItems = mealPlan.mealItems[mealType] || [];
    const { excludedCategoryIds, excludedFoodIds } =
      await this.getExcludedData(userId);

    if (input.swapType === 'food') {
      const itemIndex = this.findMealItemIndex(
        mealItems as Array<{ foodId: unknown; _id?: unknown }>,
        input.targetFoodId,
        input.targetItemId,
      );
      if (itemIndex < 0) {
        return null;
      }
      const targetItem = mealItems[itemIndex];
      const targetFood = targetItem.foodId;
      const targetTotals = this.calculateItemNutrition(
        targetFood,
        targetItem.amount,
        targetItem.unit,
      );
      const limit = input.limit ?? 10;
      const tolerance = input.tolerance ?? 0.2;

      const searchQuery = input.filters?.q;
      const candidates = await this.getSimilarFoods(
        targetFood,
        mealType,
        excludedCategoryIds,
        excludedFoodIds,
        limit,
        tolerance,
        searchQuery,
      );

      const isFoodOption = (
        option: FoodSwapOptionCandidate | null,
      ): option is FoodSwapOptionCandidate => option !== null;

      const options = candidates
        .map((food): FoodSwapOptionCandidate | null => {
          const calories = food.nutrition?.calories ?? 0;
          if (calories <= 0 || targetTotals.calories <= 0) {
            return null;
          }
          const servingMultiplier = targetTotals.calories / calories;
          const unit = food.defaultUnit ?? 0;
          const unitAmount = food.units?.[unit]?.amount ?? 1;
          const amount = this.roundAmount(servingMultiplier * unitAmount);
          if (amount <= 0) {
            return null;
          }
          const nutrition = {
            calories: calories * servingMultiplier,
            protein: (food.nutrition?.proteins ?? 0) * servingMultiplier,
            carbs: (food.nutrition?.carbs ?? 0) * servingMultiplier,
            fat: (food.nutrition?.fats ?? 0) * servingMultiplier,
          };

          return {
            foodId: food._id.toString(),
            amount,
            unit,
            nutrition,
            food,
            score: this.scoreTotals(targetTotals, nutrition),
          };
        })
        .filter(isFoodOption)
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map(({ score: _score, ...option }) => option);

      return {
        mealPlanId,
        mealType,
        swapType: 'food',
        target: {
          foodId: targetFood._id.toString(),
          amount: targetItem.amount,
          unit: targetItem.unit,
          nutrition: targetTotals,
          food: targetFood,
        },
        options,
      };
    }

    const targetTotals = this.calculateMealNutrition(mealItems);
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) {
      return {
        mealPlanId,
        mealType,
        swapType: 'meal',
        notice: 'Nutrition goals are missing for this user.',
        target: {
          items: mealItems.map((item) => ({
            foodId: item.foodId?._id?.toString(),
            amount: item.amount,
            unit: item.unit,
            food: item.foodId,
          })),
          nutrition: targetTotals,
        },
        options: [],
      };
    }

    // Extract new parameters (only available for meal swap type)
    const generationMode =
      input.swapType === 'meal' ? input.generationMode : undefined;
    const deepSearch =
      input.swapType === 'meal' ? input.deepSearch === true : false;
    const targetItemCount =
      input.swapType === 'meal' ? input.targetItemCount : undefined;
    const targetRatio =
      input.swapType === 'meal' ? input.targetRatio : undefined;

    // Determine nutrition targets based on generation mode
    let nutritionTargets: NutritionGoalsType;
    let hasInsufficientRemaining = false;
    let remainingTargets: NutritionGoalsType | undefined;

    if (generationMode === 'percentage') {
      // Percentage mode: fixed ratio of daily targets or custom ratio
      let ratio = targetRatio;
      if (!ratio && preferences) {
        if (mealType === 'breakfast') ratio = preferences.breakfastRatio;
        else if (mealType === 'lunch') ratio = preferences.lunchRatio;
        else if (mealType === 'dinner') ratio = preferences.dinnerRatio;
      }
      // Fallback default
      if (!ratio) {
        ratio = mealType === 'breakfast' ? 0.25 : 0.35;
      }
      nutritionTargets = this.getMealNutritionTargets(preferences, ratio);
    } else {
      // Remaining mode (default): fill the nutritional gap
      const result = this.calculateRemainingTargets(
        preferences,
        mealPlan.mealItems,
        mealType,
      );
      remainingTargets = result.remainingTargets;
      hasInsufficientRemaining = result.hasInsufficientRemaining;
      nutritionTargets = result.remainingTargets;
    }

    // Early exit if remaining nutrition is negative (unless deep search)
    if (hasInsufficientRemaining && !deepSearch) {
      return {
        mealPlanId,
        mealType,
        swapType: 'meal',
        notice:
          'Remaining nutrition is too low or negative to generate options.',
        remainingTargets,
        target: {
          items: mealItems.map((item) => ({
            foodId: item.foodId?._id?.toString(),
            amount: item.amount,
            unit: item.unit,
            food: item.foodId,
          })),
          nutrition: targetTotals,
        },
        options: [],
      };
    }

    const currentFoodIds = new Set<string>();
    mealItems.forEach((item) => {
      const id = item.foodId?._id?.toString();
      if (id) {
        currentFoodIds.add(id);
      }
    });
    const excludeFoods = new Set<string>(excludedFoodIds);
    currentFoodIds.forEach((id) => {
      if (id) excludeFoods.add(id);
    });

    // Deep search: relax category restrictions
    const effectiveExcludedCategories = deepSearch
      ? new Set<number>()
      : excludedCategoryIds;

    const { mainCategories, sideCategories } = this.buildCategorySets(
      mealItems,
      effectiveExcludedCategories,
    );

    // Deep search: increase limit
    const effectiveLimit = deepSearch
      ? Math.min((input.limit ?? 10) * 3, 60)
      : (input.limit ?? 10);

    // Calculate micronutrient limits based on user preferences and meal ratio
    let mealMicronutrientLimits:
      | { minFiber?: number; maxSodium?: number; maxCholesterol?: number }
      | undefined;

    if (preferences) {
      // Determine meal ratio for micronutrient calculation
      let ratio = targetRatio;
      if (!ratio) {
        if (mealType === 'breakfast') ratio = preferences.breakfastRatio ?? 0.3;
        else if (mealType === 'lunch') ratio = preferences.lunchRatio ?? 0.4;
        else if (mealType === 'dinner') ratio = preferences.dinnerRatio ?? 0.3;
        else ratio = 0.33;
      }

      const dailyMinFiber = preferences.minimumFiber || 0;
      const dailyMaxSodium = preferences.maxiumSodium || 0;
      const dailyMaxCholesterol = preferences.maxiumCholesterol || 0;

      if (dailyMinFiber > 0 || dailyMaxSodium > 0 || dailyMaxCholesterol > 0) {
        mealMicronutrientLimits = {
          minFiber: dailyMinFiber > 0 ? dailyMinFiber * ratio : undefined,
          maxSodium: dailyMaxSodium > 0 ? dailyMaxSodium * ratio : undefined,
          maxCholesterol:
            dailyMaxCholesterol > 0 ? dailyMaxCholesterol * ratio : undefined,
        };
      }
    }

    // Build scoring context for micronutrient-aware meal selection
    const swapScoringContext = mealMicronutrientLimits
      ? {
          mealType,
          targetCalories: nutritionTargets.calories,
          ...mealMicronutrientLimits,
        }
      : undefined;

    // Use different combo generation for deep search vs normal search
    let options: Array<{
      items: Array<{
        foodId: string;
        amount: number;
        unit: number;
        food: unknown;
      }>;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }>;

    const useFlexibleSearch = deepSearch || targetItemCount !== undefined;

    if (useFlexibleSearch) {
      // Deep search or specific item count: use flexible 1-3 item combos
      const flexibleCombos = await this.chooseMeal.getFlexibleMealOptions(
        mainCategories,
        sideCategories,
        nutritionTargets,
        mealType,
        effectiveLimit,
        excludeFoods,
        targetItemCount,
        swapScoringContext,
      );

      options = flexibleCombos.map((combo) => ({
        items: combo.items.map((item) => {
          const unit = item.food.defaultUnit ?? 0;
          const unitAmount = item.food.units?.[unit]?.amount ?? 1;
          return {
            foodId: item.food._id.toString(),
            amount: this.roundAmount(item.serving * unitAmount),
            unit,
            food: item.food,
          };
        }),
        nutrition: combo.totals,
      }));
    } else {
      // Normal search: use 2-item combos (main + side)
      const combos = await this.chooseMeal.getMealOptionsByCategories(
        mainCategories,
        sideCategories,
        nutritionTargets,
        mealType,
        effectiveLimit,
        excludeFoods,
        effectiveExcludedCategories,
        swapScoringContext,
      );

      options = combos.map((combo) => {
        const mainUnit = combo.mainDish.food.defaultUnit ?? 0;
        const mainUnitAmount =
          combo.mainDish.food.units?.[mainUnit]?.amount ?? 1;
        const sideUnit = combo.sideDish.food.defaultUnit ?? 0;
        const sideUnitAmount =
          combo.sideDish.food.units?.[sideUnit]?.amount ?? 1;

        return {
          items: [
            {
              foodId: combo.mainDish.food._id.toString(),
              amount: this.roundAmount(combo.mainDish.serving * mainUnitAmount),
              unit: mainUnit,
              food: combo.mainDish.food,
            },
            {
              foodId: combo.sideDish.food._id.toString(),
              amount: this.roundAmount(combo.sideDish.serving * sideUnitAmount),
              unit: sideUnit,
              food: combo.sideDish.food,
            },
          ],
          nutrition: combo.totals,
        };
      });
    }

    return {
      mealPlanId,
      mealType,
      swapType: 'meal',
      remainingTargets,
      target: {
        items: mealItems.map((item) => ({
          foodId: item.foodId?._id?.toString(),
          amount: item.amount,
          unit: item.unit,
          food: item.foodId,
        })),
        nutrition: targetTotals,
      },
      options,
    };
  }

  async applySwap(
    mealPlanId: string,
    userId: string,
    input: MealPlanSwapApplyInput,
  ) {
    const mealPlan = await this.mealPlanRepository.getById(mealPlanId);
    if (!mealPlan) {
      return null;
    }

    if (mealPlan.userId?.toString() !== userId) {
      return null;
    }

    const mealType = input.mealType;
    const mealItems = mealPlan.mealItems?.[mealType] || [];

    if (input.swapType === 'food') {
      const itemIndex = this.findMealItemIndex(
        mealItems as Array<{ foodId: unknown; _id?: unknown }>,
        input.targetFoodId,
        input.targetItemId,
      );
      if (itemIndex < 0) {
        return null;
      }

      const currentItem = mealItems[itemIndex];
      const updatedItem = {
        ...currentItem,
        foodId: new Types.ObjectId(
          input.replacement.foodId,
        ) as unknown as Schema.Types.ObjectId,
        amount: input.replacement.amount ?? currentItem.amount,
        unit: input.replacement.unit ?? currentItem.unit,
      };
      mealItems[itemIndex] = updatedItem;
    } else {
      mealPlan.mealItems[mealType] = input.replacement.items.map((item) => ({
        foodId: new Types.ObjectId(
          item.foodId,
        ) as unknown as Schema.Types.ObjectId,
        amount: item.amount,
        unit: item.unit,
      }));
    }

    const updatedMealPlan = await this.mealPlanRepository.update(mealPlanId, {
      mealItems: mealPlan.mealItems,
    });

    const populated = await this.mealPlanRepository.getListPopulate({
      _id: mealPlanId,
    });

    return populated[0] || updatedMealPlan;
  }

  async autoGenerateMealPlanForUser(
    date: Date,
    userId: string,
    targetPercentage = 100,
    generatedFoodIdsThisWeek?: Map<string, number>,
  ): Promise<PopulatedMealPlanIngre | null> {
    const userPreferences = await this.getUserPreferences(userId);
    if (!userPreferences) {
      return null;
    }

    const { excludedCategoryIds, excludedFoodIds } =
      await this.getExcludedData(userId);

    const mealPlan = await this.generateMealPlanForUser(
      date,
      userPreferences,
      excludedCategoryIds,
      excludedFoodIds,
      userId,
      targetPercentage,
      generatedFoodIdsThisWeek,
    );
    if (!mealPlan) {
      return null;
    }

    const { start, end } = this.getDayBounds(date);
    await this.mealPlanRepository.deleteMany({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate: { $gte: start, $lte: end },
    });

    const savedMealPlan = await this.mealPlanRepository.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate: date,
      mealItems: mealPlan,
      targetPercentage,
    });

    const populatedMealPlan = await this.mealPlanRepository.getListPopulate({
      _id: savedMealPlan._id,
    });

    if (!populatedMealPlan[0]) {
      return null;
    }
    return populatedMealPlan[0].toObject();
  }

  async autoGenerateMealPlanWeekForUser(
    date: Date,
    userId: string,
  ): Promise<PopulatedMealPlanIngre[]> {
    const { startOfWeek } = getWeekRange(new Date(date));
    const results: PopulatedMealPlanIngre[] = [];

    // Track foods generated during this week to prevent repetition
    const generatedFoodIdsThisWeek = new Map<string, number>();

    for (let i = 0; i < 7; i += 1) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const generated = await this.autoGenerateMealPlanForUser(
        current,
        userId,
        100,
        generatedFoodIdsThisWeek,
      );
      if (generated) {
        results.push(generated);

        // Update history for next days
        const updateHistory = (items: PopulatedMealItemIngre[]) => {
          items.forEach((item) => {
            if (item.foodId) {
              const id = item.foodId._id?.toString() || item.foodId.toString();
              generatedFoodIdsThisWeek.set(
                id,
                (generatedFoodIdsThisWeek.get(id) || 0) + 1,
              );
            }
          });
        };

        if (generated.mealItems.breakfast)
          updateHistory(generated.mealItems.breakfast);
        if (generated.mealItems.lunch) updateHistory(generated.mealItems.lunch);
        if (generated.mealItems.dinner)
          updateHistory(generated.mealItems.dinner);
      }
    }

    return results;
  }

  private async getUserPreferences(
    userId: string,
  ): Promise<ExtendedNutritionGoals | null> {
    const user = await this.userRepository.getById(userId, {
      nutritionGoals: 1,
    });
    if (!user?.nutritionGoals) {
      return null;
    }

    return user.nutritionGoals;
  }

  private getMealNutritionTargets(
    preferences: NutritionGoalsType,
    ratio: number,
  ): NutritionGoalsType {
    return {
      calories: Math.round(preferences.calories * ratio),
      proteinTarget: {
        from: Math.round(preferences.proteinTarget.from * ratio),
        to: Math.round(preferences.proteinTarget.to * ratio),
      },
      carbTarget: {
        from: Math.round(preferences.carbTarget.from * ratio),
        to: Math.round(preferences.carbTarget.to * ratio),
      },
      fatTarget: {
        from: Math.round(preferences.fatTarget.from * ratio),
        to: Math.round(preferences.fatTarget.to * ratio),
      },
    };
  }

  /**
   * Get food consumption history from the previous week
   * Used for scoring to balance familiarity and variety
   */
  private async getPreviousWeekFoodHistory(
    userId: string,
    currentDate: Date,
  ): Promise<Map<string, number>> {
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() - 1); // Yesterday

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7); // 7 days before yesterday

    const { start } = this.getDayBounds(startDate);
    const { end } = this.getDayBounds(endDate);

    const mealPlans = await this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: { $gte: start, $lte: end },
    });

    const foodCountMap = new Map<string, number>();

    for (const plan of mealPlans) {
      const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = [
        'breakfast',
        'lunch',
        'dinner',
      ];

      for (const mealType of mealTypes) {
        const items = plan.mealItems[mealType] || [];
        for (const item of items) {
          const foodId =
            (
              item.foodId as unknown as { _id?: Types.ObjectId }
            )?._id?.toString() ??
            (item.foodId as unknown as Types.ObjectId)?.toString();
          if (foodId) {
            foodCountMap.set(foodId, (foodCountMap.get(foodId) ?? 0) + 1);
          }
        }
      }
    }

    return foodCountMap;
  }

  /**
   * Get food IDs eaten on the same day last week
   */
  private async getSameDayLastWeekFoodHistory(
    userId: string,
    currentDate: Date,
  ): Promise<Set<string>> {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - 7); // Same day last week

    const { start, end } = this.getDayBounds(targetDate);

    const mealPlan = await this.mealPlanRepository.getOnePopulate({
      userId,
      mealDate: { $gte: start, $lte: end },
    });

    const foodIds = new Set<string>();

    if (mealPlan) {
      const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = [
        'breakfast',
        'lunch',
        'dinner',
      ];

      for (const mealType of mealTypes) {
        const items = mealPlan.mealItems[mealType] || [];
        for (const item of items) {
          const foodId =
            (
              item.foodId as unknown as { _id?: Types.ObjectId }
            )?._id?.toString() ??
            (item.foodId as unknown as Types.ObjectId)?.toString();
          if (foodId) {
            foodIds.add(foodId);
          }
        }
      }
    }

    return foodIds;
  }

  /**
   * Get food IDs eaten yesterday (heavy penalty to avoid repetition)
   */
  private async getYesterdayFoodHistory(
    userId: string,
    currentDate: Date,
  ): Promise<Set<string>> {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const { start, end } = this.getDayBounds(yesterday);

    const mealPlan = await this.mealPlanRepository.getOnePopulate({
      userId,
      mealDate: { $gte: start, $lte: end },
    });

    const foodIds = new Set<string>();

    if (mealPlan) {
      const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = [
        'breakfast',
        'lunch',
        'dinner',
      ];

      for (const mealType of mealTypes) {
        const items = mealPlan.mealItems[mealType] || [];
        for (const item of items) {
          const foodId =
            (
              item.foodId as unknown as { _id?: Types.ObjectId }
            )?._id?.toString() ??
            (item.foodId as unknown as Types.ObjectId)?.toString();
          if (foodId) {
            foodIds.add(foodId);
          }
        }
      }
    }

    return foodIds;
  }

  /**
   * Check if a date is on a weekend (Saturday or Sunday)
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Get ingredient IDs from user's pantry for scoring
   */
  private async getPantryIngredientIds(userId: string): Promise<Set<string>> {
    const pantryItems = await PantryModel.find({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      status: 'in_pantry',
      quantity: { $gt: 0 },
    }).exec();

    const ingredientIds = new Set<string>();
    for (const item of pantryItems) {
      if (item.ingredientFoodId) {
        ingredientIds.add(item.ingredientFoodId.toString());
      }
    }

    return ingredientIds;
  }

  private async generateMealPlanForUser(
    date: Date,
    preferences: NutritionGoalsType,
    excludedCategoryIds: Set<number>,
    excludedFoodIds: Set<string>,
    userId?: string,
    targetPercentage = 100,
    generatedFoodIdsThisWeek?: Map<string, number>,
  ): Promise<MealPlanForUser | null> {
    const recurringFoods = userId
      ? await this.getRecurringFoodsForDate(userId, date, excludedFoodIds)
      : [];
    const recurringMain = recurringFoods.filter(
      (food) => food.property?.mainDish,
    );
    const recurringSide = recurringFoods.filter(
      (food) => food.property?.sideDish,
    );

    const allowedCategories = _.range(1, 137).filter(
      (id) => !excludedCategoryIds.has(id),
    );

    // Get previous week food history for scoring
    const previousWeekFoodIds = userId
      ? await this.getPreviousWeekFoodHistory(userId, date)
      : new Map<string, number>();

    // Merge recent history from this week's generation
    if (generatedFoodIdsThisWeek) {
      generatedFoodIdsThisWeek.forEach((count, id) => {
        previousWeekFoodIds.set(id, (previousWeekFoodIds.get(id) || 0) + count);
      });
    }

    // Get same day last week food history for routine scoring
    const sameDayLastWeekFoodIds = userId
      ? await this.getSameDayLastWeekFoodHistory(userId, date)
      : new Set<string>();

    // Get yesterday's food history for heavy penalty
    const yesterdayFoodIds = userId
      ? await this.getYesterdayFoodHistory(userId, date)
      : new Set<string>();

    // Get pantry ingredients for scoring
    const pantryIngredientIds = userId
      ? await this.getPantryIngredientIds(userId)
      : new Set<string>();

    // Check if target date is a weekend
    const isWeekend = this.isWeekend(date);

    const getMealWithScoring = async (
      mainCategories: number[],
      sideCategories: number[],
      nutritionTargets: NutritionGoalsType,
      mealType: MealType,
      micronutrientLimits: {
        minFiber?: number;
        maxSodium?: number;
        maxCholesterol?: number;
      } = {},
      usedFoodIdsToday: Set<string> = new Set(),
      usedCategoryIdsToday: Set<number> = new Set(),
    ) => {
      // Build recurring bonus map (Direct + Related foods)
      const recurringBonusMap = new Map<string, number>();

      // 1. Direct Recurring Foods get highest bonus
      const recurringFoodIdList = recurringFoods
        .map((f) => f._id?.toString())
        .filter(Boolean) as string[];
      recurringFoodIdList.forEach((id) =>
        recurringBonusMap.set(id, SCORE_WEIGHTS.RECURRING_COLLECTION_BONUS),
      );

      // TODO: Add relatedFoods field to Food schema and use it here
      // Currently relatedFoods field does not exist in Food model

      // Build scoring context
      const scoringContext: ScoringContext = {
        mealType,
        previousWeekFoodIds,
        sameDayLastWeekFoodIds,
        yesterdayFoodIds, // Heavy penalty for yesterday's foods
        recurringBonusMap,
        recurringMainFoods: recurringMain,
        recurringSideFoods: recurringSide,
        excludeFoodIdsForDay: usedFoodIdsToday,
        usedCategoryIdsToday: usedCategoryIdsToday, // Add context
        pantryIngredientIds,
        targetCalories: nutritionTargets.calories,
        isWeekend,
        ...micronutrientLimits,
      };

      // First try recurring foods with scoring
      if (recurringFoods.length > 0) {
        const recurringResult = await this.chooseMeal.getMealsFromFoods(
          recurringMain,
          recurringSide,
          nutritionTargets,
          excludedCategoryIds,
          scoringContext,
        );
        if (recurringResult.mainDish && recurringResult.sideDish) {
          return recurringResult;
        }
      }

      // Try with scoring system
      let result = await this.chooseMeal.getMealsByCategoriesWithScoring(
        mainCategories,
        sideCategories,
        nutritionTargets,
        scoringContext,
        excludedCategoryIds,
        20, // Top-K = 20 (Increased from 5 for variety)
      );

      // Fallback to all categories if no result
      if (!result.mainDish || !result.sideDish) {
        result = await this.chooseMeal.getMealsByCategoriesWithScoring(
          allowedCategories,
          allowedCategories,
          nutritionTargets,
          { ...scoringContext, mealType }, // Keep mealType for scoring
          excludedCategoryIds,
          20,
        );
      }

      // Final fallback without scoring
      if (!result.mainDish || !result.sideDish) {
        result = await this.chooseMeal.getMealsByCategories(
          allowedCategories,
          allowedCategories,
          nutritionTargets,
          undefined,
          excludedCategoryIds,
          scoringContext, // Pass context to apply hard filter for excludeFoodIdsForDay
        );
      }

      return result;
    };

    const breakfastMainCategories = [10, 66];
    const breakfastSideCategories = [28, 13];

    const lunchMainCategories = [43, 5];
    const lunchSideCategories = [54, 9];

    const dinnerMainCategories = [10, 66];
    const dinnerSideCategories = [28, 13];

    // Use user preferences for meal ratios, fallback to defaults if not set
    const breakfastRatio = preferences.breakfastRatio ?? 0.3;
    const lunchRatio = preferences.lunchRatio ?? 0.4;
    const dinnerRatio = preferences.dinnerRatio ?? 0.3;

    // Scale nutrition targets by targetPercentage (e.g., 80% = eat 80% of daily target)
    const scaleFactor = targetPercentage / 100;

    const extendedPreferences = preferences as ExtendedNutritionGoals;
    const dailyMinFiber = (extendedPreferences.minimumFiber || 0) * scaleFactor;
    const dailyMaxSodium =
      (extendedPreferences.maxiumSodium || 0) * scaleFactor;
    const dailyMaxCholesterol =
      (extendedPreferences.maxiumCholesterol || 0) * scaleFactor;

    const scaledPreferences: NutritionGoalsType = {
      ...preferences,
      calories: Math.round(preferences.calories * scaleFactor),
      proteinTarget: {
        from: Math.round(preferences.proteinTarget.from * scaleFactor),
        to: Math.round(preferences.proteinTarget.to * scaleFactor),
      },
      carbTarget: {
        from: Math.round(preferences.carbTarget.from * scaleFactor),
        to: Math.round(preferences.carbTarget.to * scaleFactor),
      },
      fatTarget: {
        from: Math.round(preferences.fatTarget.from * scaleFactor),
        to: Math.round(preferences.fatTarget.to * scaleFactor),
      },
    };

    const breakfastTargets = this.getMealNutritionTargets(
      scaledPreferences,
      breakfastRatio,
    );
    const lunchTargets = this.getMealNutritionTargets(
      scaledPreferences,
      lunchRatio,
    );
    const dinnerTargets = this.getMealNutritionTargets(
      scaledPreferences,
      dinnerRatio,
    );

    // Generate meals with random order to distribute recurring foods fairly
    const mealConfigs = {
      breakfast: {
        main: breakfastMainCategories,
        side: breakfastSideCategories,
        targets: breakfastTargets,
        ratio: breakfastRatio,
      },
      lunch: {
        main: lunchMainCategories,
        side: lunchSideCategories,
        targets: lunchTargets,
        ratio: lunchRatio,
      },
      dinner: {
        main: dinnerMainCategories,
        side: dinnerSideCategories,
        targets: dinnerTargets,
        ratio: dinnerRatio,
      },
    };

    type MealResult = {
      mainDish: { food: Food; serving: number } | null;
      sideDish: { food: Food; serving: number } | null;
      score?: number;
      scoreBreakdown?: Record<string, number>;
    };

    const mealTypes = _.shuffle(['breakfast', 'lunch', 'dinner'] as const);
    const results: Record<string, MealResult> = {};
    const usedFoodIdsToday = new Set<string>();
    const usedCategoryIdsToday = new Set<number>();

    for (const type of mealTypes) {
      const config = mealConfigs[type];
      const limits = {
        minFiber: dailyMinFiber * config.ratio,
        maxSodium: dailyMaxSodium * config.ratio,
        maxCholesterol: dailyMaxCholesterol * config.ratio,
      };

      const result = await getMealWithScoring(
        config.main,
        config.side,
        config.targets,
        type,
        limits,
        usedFoodIdsToday,
        usedCategoryIdsToday, // Pass usage history
      );
      results[type] = result;

      if (result.mainDish) {
        usedFoodIdsToday.add(result.mainDish.food._id?.toString() || '');
        // Track categories
        result.mainDish.food.categories?.forEach((cat: number) =>
          usedCategoryIdsToday.add(cat),
        );
      }
      if (result.sideDish) {
        usedFoodIdsToday.add(result.sideDish.food._id?.toString() || '');
        result.sideDish.food.categories?.forEach((cat: number) =>
          usedCategoryIdsToday.add(cat),
        );
      }
    }

    const {
      breakfast: breakfastResult,
      lunch: lunchResult,
      dinner: dinnerResult,
    } = results;

    if (
      !breakfastResult.mainDish ||
      !lunchResult.mainDish ||
      !dinnerResult.mainDish
    ) {
      // Only mainDish is required; sideDish can be null for single-food meals
      return null;
    }

    const breakfastMainDishId = breakfastResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const breakfastSideDishId = breakfastResult.sideDish?.food
      ._id as unknown as Schema.Types.ObjectId | undefined;

    const lunchMainDishId = lunchResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const lunchSideDishId = lunchResult.sideDish?.food._id as unknown as
      | Schema.Types.ObjectId
      | undefined;

    const dinnerMainDishId = dinnerResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const dinnerSideDishId = dinnerResult.sideDish?.food._id as unknown as
      | Schema.Types.ObjectId
      | undefined;

    // Helper to build meal items (filter out null sideDish)
    const buildMealItems = (
      mainDish: { food: Food; serving: number },
      sideDish: { food: Food; serving: number } | null,
      mainId: Schema.Types.ObjectId,
      sideId: Schema.Types.ObjectId | undefined,
    ) => {
      const items = [
        {
          foodId: mainId,
          amount:
            mainDish.serving *
            mainDish.food.units[mainDish.food.defaultUnit].amount,
          unit: mainDish.food.defaultUnit,
        },
      ];
      if (sideDish && sideId) {
        items.push({
          foodId: sideId,
          amount:
            sideDish.serving *
            sideDish.food.units[sideDish.food.defaultUnit].amount,
          unit: sideDish.food.defaultUnit,
        });
      }
      return items;
    };

    return {
      breakfast: buildMealItems(
        breakfastResult.mainDish,
        breakfastResult.sideDish,
        breakfastMainDishId,
        breakfastSideDishId,
      ),
      lunch: buildMealItems(
        lunchResult.mainDish,
        lunchResult.sideDish,
        lunchMainDishId,
        lunchSideDishId,
      ),
      dinner: buildMealItems(
        dinnerResult.mainDish,
        dinnerResult.sideDish,
        dinnerMainDishId,
        dinnerSideDishId,
      ),
    };
  }

  async autoGenerateMealPlanForDemo(
    date: Date,
    preferences: MealPlanPreferences,
    userId?: string,
  ): Promise<PopulatedMealPlanIngre | null> {
    const mealPlan = await this.generateMealPlanForDemo(date, preferences);
    if (!mealPlan) {
      return null;
    }

    const convertedMealPlan = {
      mealDate: mealPlan.mealDate,
      mealItems: {
        breakfast: mealPlan.mealItems.breakfast.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
        lunch: mealPlan.mealItems.lunch.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
        dinner: mealPlan.mealItems.dinner.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
      },
    };

    const savedMealPlan = await this.mealPlanRepository.create({
      ...convertedMealPlan,
      ...(userId
        ? {
            userId: new Types.ObjectId(
              userId,
            ) as unknown as Schema.Types.ObjectId,
          }
        : {}),
    });

    const populatedMealPlan = await this.mealPlanRepository.getListPopulate({
      _id: savedMealPlan._id,
    });

    return populatedMealPlan[0] || null;
  }

  private async generateMealPlanForDemo(
    _date: Date,
    preferences: MealPlanPreferences,
  ): Promise<GeneratedMealPlan | null> {
    const nutritionRanges: NutritionGoalsType = {
      calories: preferences.calories,
      proteinTarget: {
        from: Math.round(preferences.protein * 0.6),
        to: Math.round(preferences.protein * 1.4),
      },
      carbTarget: {
        from: Math.round(preferences.carbs * 0.6),
        to: Math.round(preferences.carbs * 1.4),
      },
      fatTarget: {
        from: Math.round(preferences.fat * 0.6),
        to: Math.round(preferences.fat * 1.4),
      },
    };

    // Default ratios for demo mode (no user preferences available)
    const breakfastTargets = this.getMealNutritionTargets(nutritionRanges, 0.3);
    const lunchTargets = this.getMealNutritionTargets(nutritionRanges, 0.4);
    const dinnerTargets = this.getMealNutritionTargets(nutritionRanges, 0.3);

    const allCategoryIds = _.range(1, 137);
    const excluded: number[] = EXCLUDED_BY_DIET[preferences.type] || [];
    const filteredCategoryIds = allCategoryIds.filter(
      (id) => !excluded.includes(id),
    );

    const fallbackMealSelection = async (
      targets: NutritionGoalsType,
      mealType: MealType,
    ) => {
      let result = await this.chooseMeal.getMealsByCategories(
        filteredCategoryIds,
        filteredCategoryIds,
        targets,
        mealType,
        excluded,
      );

      if (!result.mainDish || !result.sideDish) {
        result = await this.chooseMeal.getMealsByCategories(
          filteredCategoryIds,
          filteredCategoryIds,
          targets,
          undefined,
          excluded,
        );
      }

      return result;
    };

    const [breakfastResult, lunchResult, dinnerResult] = await Promise.all([
      fallbackMealSelection(breakfastTargets, 'breakfast'),
      fallbackMealSelection(lunchTargets, 'lunch'),
      fallbackMealSelection(dinnerTargets, 'dinner'),
    ]);

    if (
      !breakfastResult.mainDish ||
      !breakfastResult.sideDish ||
      !lunchResult.mainDish ||
      !lunchResult.sideDish ||
      !dinnerResult.mainDish ||
      !dinnerResult.sideDish
    ) {
      return null;
    }

    return {
      mealDate: _date,
      mealItems: {
        breakfast: [
          {
            foodId: breakfastResult.mainDish.food,
            amount:
              breakfastResult.mainDish.serving *
              breakfastResult.mainDish.food.units[
                breakfastResult.mainDish.food.defaultUnit
              ].amount,
            unit: breakfastResult.mainDish.food.defaultUnit,
          },
          {
            foodId: breakfastResult.sideDish.food,
            amount:
              breakfastResult.sideDish.serving *
              breakfastResult.sideDish.food.units[
                breakfastResult.sideDish.food.defaultUnit
              ].amount,
            unit: breakfastResult.sideDish.food.defaultUnit,
          },
        ],
        lunch: [
          {
            foodId: lunchResult.mainDish.food,
            amount:
              lunchResult.mainDish.serving *
              lunchResult.mainDish.food.units[
                lunchResult.mainDish.food.defaultUnit
              ].amount,
            unit: lunchResult.mainDish.food.defaultUnit,
          },
          {
            foodId: lunchResult.sideDish.food,
            amount:
              lunchResult.sideDish.serving *
              lunchResult.sideDish.food.units[
                lunchResult.sideDish.food.defaultUnit
              ].amount,
            unit: lunchResult.sideDish.food.defaultUnit,
          },
        ],
        dinner: [
          {
            foodId: dinnerResult.mainDish.food,
            amount:
              dinnerResult.mainDish.serving *
              dinnerResult.mainDish.food.units[
                dinnerResult.mainDish.food.defaultUnit
              ].amount,
            unit: dinnerResult.mainDish.food.defaultUnit,
          },
          {
            foodId: dinnerResult.sideDish.food,
            amount:
              dinnerResult.sideDish.serving *
              dinnerResult.sideDish.food.units[
                dinnerResult.sideDish.food.defaultUnit
              ].amount,
            unit: dinnerResult.sideDish.food.defaultUnit,
          },
        ],
      },
    };
  }
}

export default new MealPlanService();
