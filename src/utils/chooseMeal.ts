import { FoodRepository } from '@/repositories/food.repository';
import { Food, NutritionGoalsType, Range } from '@/types';
import { compareFood, compareFoodReverse } from '@/utils/sortFood';

// Scoring context for intelligent meal selection
export interface ScoringContext {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  previousWeekFoodIds?: Map<string, number>; // foodId -> count eaten last week
  pantryIngredientIds?: Set<string>; // ingredient IDs available in user's pantry
  targetCalories: number;
  isWeekend?: boolean;
}

// Combination with score for ranking
interface ScoredCombination {
  mainDish: { food: Food; serving: number };
  sideDish: { food: Food; serving: number };
  totals: { calories: number; protein: number; carbs: number; fat: number };
  score: number;
  scoreBreakdown: {
    mealTypeMatch: number;
    nutritionalFit: number;
    complexityMatch: number;
    historyBonus: number;
    pantryAvailability: number;
  };
}

// Score weights configuration
const SCORE_WEIGHTS = {
  MEAL_TYPE_MATCH: 20,
  NUTRITIONAL_FIT_PERFECT: 15,
  NUTRITIONAL_FIT_GOOD: 10,
  NUTRITIONAL_FIT_OK: 5,
  COMPLEXITY_MATCH: 10,
  HISTORY_FAMILIAR: 10,
  HISTORY_TOO_FREQUENT: -5,
  HISTORY_FRESH: 5,
  PANTRY_FULL: 15, // 100% ingredients available
  PANTRY_PARTIAL: 8, // 50-99% ingredients available
};

export class ChooseMeal {
  private foodRepository: FoodRepository;

  constructor() {
    this.foodRepository = new FoodRepository();
  }

  private buildValidCombinations(
    mainDishes: Food[],
    sideDishes: Food[],
    nutritionRange: {
      calories: Range;
      proteins: Range;
      carbs: Range;
      fats: Range;
    },
    maxCombinations = 20,
  ) {
    const servingSizes = [
      1,
      1, // 1-1
      1,
      0.5, // 1-0.5
      1,
      1.5, // 1-1.5
      1,
      2, // 1-2
      0.5,
      1, // 0.5-1
      1.5,
      1, // 1.5-1
      2,
      1, // 2-1
      0.5,
      0.5, // 0.5-0.5
      1.5,
      1.5, // 1.5-1.5
      2,
      2, // 2-2
      0.5,
      1.5, // 0.5-1.5
      1.5,
      0.5, // 1.5-0.5
      0.5,
      2, // 0.5-2
      2,
      0.5, // 2-0.5
      1.5,
      2, // 1.5-2
      2,
      1.5, // 2-1.5
    ];

    const validCombinations: {
      mainDish: { food: Food; serving: number };
      sideDish: { food: Food; serving: number };
      totals: { calories: number; protein: number; carbs: number; fat: number };
    }[] = [];

    for (let i = 0; i < servingSizes.length - 1; i += 2) {
      const mainServing = servingSizes[i];
      const sideServing = servingSizes[i + 1];

      let mainPointer = 0;
      let sidePointer = 0;

      while (
        mainPointer < mainDishes.length &&
        sidePointer < sideDishes.length
      ) {
        const mainFood = mainDishes[mainPointer];
        const sideFood = sideDishes[sidePointer];

        const mainTotalNutrition = this.calculateTotalNutrition(
          mainFood,
          mainServing,
        );
        const sideTotalNutrition = this.calculateTotalNutrition(
          sideFood,
          sideServing,
        );

        const totalCalories =
          mainTotalNutrition.calories + sideTotalNutrition.calories;
        const totalProtein =
          mainTotalNutrition.protein + sideTotalNutrition.protein;
        const totalCarbs = mainTotalNutrition.carbs + sideTotalNutrition.carbs;
        const totalFat = mainTotalNutrition.fat + sideTotalNutrition.fat;

        if (
          totalCalories >= nutritionRange.calories.from &&
          totalCalories <= nutritionRange.calories.to &&
          totalProtein >= nutritionRange.proteins.from &&
          totalProtein <= nutritionRange.proteins.to &&
          totalCarbs >= nutritionRange.carbs.from &&
          totalCarbs <= nutritionRange.carbs.to &&
          totalFat >= nutritionRange.fats.from &&
          totalFat <= nutritionRange.fats.to
        ) {
          validCombinations.push({
            mainDish: { food: mainFood, serving: mainServing },
            sideDish: { food: sideFood, serving: sideServing },
            totals: {
              calories: totalCalories,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
            },
          });

          if (validCombinations.length >= maxCombinations) break;
        }

        const currentTotalCalories =
          mainFood.nutrition.calories + sideFood.nutrition.calories;

        if (currentTotalCalories < nutritionRange.calories.from) {
          mainPointer++;
        } else if (currentTotalCalories > nutritionRange.calories.to) {
          sidePointer++;
        } else {
          sidePointer++;
        }
      }
      if (validCombinations.length >= maxCombinations) break;
    }

    return validCombinations;
  }

  private calculateTotalNutrition(food: Food, servingSize: number) {
    const nutrition = (
      food.nutrition as unknown as { toObject: () => Record<string, number> }
    ).toObject();

    const totalCalories = nutrition.calories * servingSize;
    const totalProtein = nutrition.proteins * servingSize;
    const totalCarbs = nutrition.carbs * servingSize;
    const totalFat = nutrition.fats * servingSize;

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
    };
  }

  private calculateNutritionRange(
    target: NutritionGoalsType,
    tolerance = 0.05,
  ) {
    const calories: Range = {
      from: target.calories * (1 - 0.02),
      to: target.calories * (1 + 0.02),
    };

    const proteins: Range = {
      from: target.proteinTarget.from * (1 - tolerance),
      to: target.proteinTarget.to * (1 + tolerance),
    };

    const carbs: Range = {
      from: target.carbTarget.from * (1 - tolerance),
      to: target.carbTarget.to * (1 + tolerance),
    };

    const fats: Range = {
      from: target.fatTarget.from * (1 - tolerance),
      to: target.fatTarget.to * (1 + tolerance),
    };

    return { calories, proteins, carbs, fats };
  }

  // ============ SCORING METHODS ============

  /**
   * Calculate meal type match score
   * Foods marked as suitable for the meal type get bonus points
   */
  private calculateMealTypeScore(
    food: Food,
    mealType: 'breakfast' | 'lunch' | 'dinner',
  ): number {
    const property = food.property as unknown as Record<string, boolean>;
    if (!property) return 0;

    const mealTypeKey = `is${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
    return property[mealTypeKey] ? SCORE_WEIGHTS.MEAL_TYPE_MATCH : 0;
  }

  /**
   * Calculate nutritional fit score based on deviation from target
   */
  private calculateNutritionalFitScore(
    actualCalories: number,
    targetCalories: number,
  ): number {
    if (targetCalories <= 0) return 0;

    const deviation =
      Math.abs(actualCalories - targetCalories) / targetCalories;

    if (deviation < 0.02) return SCORE_WEIGHTS.NUTRITIONAL_FIT_PERFECT; // < 2%
    if (deviation < 0.05) return SCORE_WEIGHTS.NUTRITIONAL_FIT_GOOD; // < 5%
    if (deviation < 0.1) return SCORE_WEIGHTS.NUTRITIONAL_FIT_OK; // < 10%
    return 0;
  }

  /**
   * Calculate complexity match score
   * Breakfast prefers simple foods, dinner allows more complex
   */
  private calculateComplexityScore(
    food: Food,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    isWeekend: boolean,
  ): number {
    const property = food.property as unknown as Record<string, number>;
    const complexity = property?.complexity ?? 2;
    const prepTime = property?.prepTime ?? 15;

    let score = 0;

    if (mealType === 'breakfast') {
      // Breakfast prefers quick and simple foods
      if (prepTime <= 15 && complexity <= 2) {
        score += SCORE_WEIGHTS.COMPLEXITY_MATCH;
      }
    } else if (mealType === 'lunch') {
      // Lunch prefers moderate complexity
      if (prepTime <= 30) {
        score += SCORE_WEIGHTS.COMPLEXITY_MATCH / 2;
      }
    } else if (mealType === 'dinner') {
      // Dinner allows more complex foods, especially on weekends
      if (complexity >= 3 || isWeekend) {
        score += SCORE_WEIGHTS.COMPLEXITY_MATCH / 2;
      }
    }

    return score;
  }

  /**
   * Calculate history bonus/penalty based on previous week consumption
   */
  private calculateHistoryScore(
    foodId: string,
    previousWeekFoodIds?: Map<string, number>,
  ): number {
    if (!previousWeekFoodIds) return 0;

    const count = previousWeekFoodIds.get(foodId) ?? 0;

    if (count === 0) {
      // Fresh food not eaten recently - bonus for variety
      return SCORE_WEIGHTS.HISTORY_FRESH;
    } else if (count <= 2) {
      // Familiar food - small bonus
      return SCORE_WEIGHTS.HISTORY_FAMILIAR;
    } else {
      // Too frequent - penalty to encourage variety
      return SCORE_WEIGHTS.HISTORY_TOO_FREQUENT;
    }
  }

  /**
   * Calculate pantry availability score
   * Bonus for foods whose ingredients are available in user's pantry
   */
  private calculatePantryScore(
    food: Food,
    pantryIngredientIds?: Set<string>,
  ): number {
    if (!pantryIngredientIds || pantryIngredientIds.size === 0) return 0;

    // Get ingredients from food
    const ingredients = food.ingredients ?? [];
    if (ingredients.length === 0) return 0;

    // Count how many ingredients are in pantry
    let matchCount = 0;
    for (const ing of ingredients) {
      const ingId = (
        ing.ingredientFoodId as unknown as { toString: () => string }
      )?.toString?.();
      if (ingId && pantryIngredientIds.has(ingId)) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / ingredients.length;

    if (matchRatio >= 1) {
      return SCORE_WEIGHTS.PANTRY_FULL; // 100% ingredients available
    } else if (matchRatio >= 0.5) {
      return SCORE_WEIGHTS.PANTRY_PARTIAL; // 50-99% ingredients available
    }
    return 0;
  }

  /**
   * Calculate total score for a food combination
   */
  private calculateCombinationScore(
    mainFood: Food,
    sideFood: Food,
    totals: { calories: number; protein: number; carbs: number; fat: number },
    context: ScoringContext,
  ): { score: number; breakdown: ScoredCombination['scoreBreakdown'] } {
    const mainId = mainFood._id?.toString() ?? '';
    const sideId = sideFood._id?.toString() ?? '';

    // Meal type match (average of main and side)
    const mealTypeMatch =
      (this.calculateMealTypeScore(mainFood, context.mealType) +
        this.calculateMealTypeScore(sideFood, context.mealType)) /
      2;

    // Nutritional fit
    const nutritionalFit = this.calculateNutritionalFitScore(
      totals.calories,
      context.targetCalories,
    );

    // Complexity match (average of main and side)
    const complexityMatch =
      (this.calculateComplexityScore(
        mainFood,
        context.mealType,
        context.isWeekend ?? false,
      ) +
        this.calculateComplexityScore(
          sideFood,
          context.mealType,
          context.isWeekend ?? false,
        )) /
      2;

    // History bonus (average of main and side)
    const historyBonus =
      (this.calculateHistoryScore(mainId, context.previousWeekFoodIds) +
        this.calculateHistoryScore(sideId, context.previousWeekFoodIds)) /
      2;

    // Pantry availability (average of main and side)
    const pantryAvailability =
      (this.calculatePantryScore(mainFood, context.pantryIngredientIds) +
        this.calculatePantryScore(sideFood, context.pantryIngredientIds)) /
      2;

    const totalScore =
      mealTypeMatch +
      nutritionalFit +
      complexityMatch +
      historyBonus +
      pantryAvailability;

    return {
      score: totalScore,
      breakdown: {
        mealTypeMatch,
        nutritionalFit,
        complexityMatch,
        historyBonus,
        pantryAvailability,
      },
    };
  }

  /**
   * Select from top K combinations randomly (Top-K Random Selection)
   * This ensures quality while maintaining variety
   */
  private selectTopKRandom<T extends { score: number }>(
    items: T[],
    topK = 5,
  ): T | null {
    if (items.length === 0) return null;

    // Sort by score descending
    const sorted = [...items].sort((a, b) => b.score - a.score);

    // Take top K items
    const topItems = sorted.slice(0, Math.min(topK, sorted.length));

    // Random select from top K
    const randomIndex = Math.floor(Math.random() * topItems.length);
    return topItems[randomIndex];
  }

  async getMainDishes(
    mainCategories: number[],
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<Food[]> {
    const excluded = excludedCategoryIds
      ? Array.from(excludedCategoryIds).filter((id) => Number.isFinite(id))
      : [];

    const query: Record<string, unknown> = {
      'property.mainDish': true,
      categories: {
        $in: mainCategories,
        ...(excluded.length > 0 ? { $nin: excluded } : {}),
      },
      deleted: false,
    };

    if (mealType) {
      query[
        `property.is${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
      ] = true;
    }

    return this.foodRepository.getList(
      query,
      {
        name: 1,
        imgUrls: 1,
        'nutrition.carbs': 1,
        'nutrition.fats': 1,
        'nutrition.proteins': 1,
        'nutrition.calories': 1,
        _id: 1,
        defaultUnit: 1,
        units: 1,
      },
      { limit: 1000 },
    );
  }

  async getSideDishes(
    sideCategories: number[],
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<Food[]> {
    const excluded = excludedCategoryIds
      ? Array.from(excludedCategoryIds).filter((id) => Number.isFinite(id))
      : [];

    const query: Record<string, unknown> = {
      'property.sideDish': true,
      categories: {
        $in: sideCategories,
        ...(excluded.length > 0 ? { $nin: excluded } : {}),
      },
      deleted: false,
    };

    if (mealType) {
      query[
        `property.is${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
      ] = true;
    }

    return this.foodRepository.getList(
      query,
      {
        name: 1,
        imgUrls: 1,
        'nutrition.carbs': 1,
        'nutrition.fats': 1,
        'nutrition.proteins': 1,
        'nutrition.calories': 1,
        _id: 1,
        defaultUnit: 1,
        units: 1,
      },
      { limit: 1000 },
    );
  }

  async getMealsByCategories(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<{
    mainDish: { food: Food; serving: number } | null;
    sideDish: { food: Food; serving: number } | null;
  }> {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const validCombinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      20,
    );

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
  }

  /**
   * Get meals by categories with intelligent scoring system
   * Uses Top-K Random Selection for quality + variety balance
   */
  async getMealsByCategoriesWithScoring(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    scoringContext: ScoringContext,
    excludedCategoryIds?: Iterable<number>,
    topK = 5,
  ): Promise<{
    mainDish: { food: Food; serving: number } | null;
    sideDish: { food: Food; serving: number } | null;
    score?: number;
    scoreBreakdown?: ScoredCombination['scoreBreakdown'];
  }> {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(
        mainCategories,
        scoringContext.mealType,
        excludedCategoryIds,
      ),
      this.getSideDishes(
        sideCategories,
        scoringContext.mealType,
        excludedCategoryIds,
      ),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const validCombinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      50, // Get more combinations for better scoring pool
    );

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    // Calculate scores for each combination
    const scoredCombinations: ScoredCombination[] = validCombinations.map(
      (combo) => {
        const { score, breakdown } = this.calculateCombinationScore(
          combo.mainDish.food,
          combo.sideDish.food,
          combo.totals,
          scoringContext,
        );

        return {
          ...combo,
          score,
          scoreBreakdown: breakdown,
        };
      },
    );

    // Select from top K using random selection
    const selected = this.selectTopKRandom(scoredCombinations, topK);

    if (!selected) {
      return { mainDish: null, sideDish: null };
    }

    return {
      mainDish: selected.mainDish,
      sideDish: selected.sideDish,
      score: selected.score,
      scoreBreakdown: selected.scoreBreakdown,
    };
  }

  async getMealOptionsByCategories(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    limit = 10,
    excludeFoodIds: Set<string> = new Set(),
    excludedCategoryIds?: Iterable<number>,
  ) {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const maxCombinations = Math.max(limit * 5, 20);
    const combinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      maxCombinations,
    ).filter(
      (combo) =>
        !excludeFoodIds.has(combo.mainDish.food._id.toString()) &&
        !excludeFoodIds.has(combo.sideDish.food._id.toString()),
    );

    return combinations.slice(0, limit);
  }

  async getMealsFromFoods(
    mainDishes: Food[],
    sideDishes: Food[],
    nutritionGoals: NutritionGoalsType,
    excludedCategoryIds?: Iterable<number>,
  ): Promise<{
    mainDish: { food: Food; serving: number } | null;
    sideDish: { food: Food; serving: number } | null;
  }> {
    const excluded = excludedCategoryIds
      ? Array.from(excludedCategoryIds).filter((id) => Number.isFinite(id))
      : [];

    const isAllowed = (food: Food) =>
      excluded.length === 0 ||
      !food.categories?.some((category) => excluded.includes(category));

    const filteredMain = mainDishes.filter(isAllowed);
    const filteredSide = sideDishes.filter(isAllowed);

    if (filteredMain.length === 0 || filteredSide.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);
    filteredMain.sort(compareFood);
    filteredSide.sort(compareFoodReverse);

    const validCombinations = this.buildValidCombinations(
      filteredMain,
      filteredSide,
      nutritionRange,
      20,
    );

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
  }
}
