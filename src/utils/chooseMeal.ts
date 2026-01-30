import { FoodRepository } from '@/repositories/food.repository';
import { Food, NutritionGoalsType, Range } from '@/types';
import { compareFood, compareFoodReverse } from '@/utils/sortFood';

// Scoring context for intelligent meal selection
export interface ScoringContext {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  previousWeekFoodIds?: Map<string, number>; // foodId -> count eaten last week
  sameDayLastWeekFoodIds?: Set<string>; // food IDs eaten on the same day last week
  yesterdayFoodIds?: Set<string>; // food IDs eaten yesterday (heavy penalty)
  recurringBonusMap?: Map<string, number>; // foodId -> bonus score
  recurringMainFoods?: Food[]; // Main dishes from recurring collections (to inject)
  recurringSideFoods?: Food[]; // Side dishes from recurring collections (to inject)
  excludeFoodIdsForDay?: Set<string>; // Food IDs already used today (to avoid repetition)
  pantryIngredientIds?: Set<string>; // ingredient IDs available in user's pantry
  targetCalories: number;
  isWeekend?: boolean;
  minFiber?: number;
  maxSodium?: number;
  maxCholesterol?: number;
  usedCategoryIdsToday?: Set<number>; // Categories used in previous meals today
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
    recurringBonus: number;
    micronutrientFit: number;
  };
}

// Score weights configuration
// Score weights configuration
// Score weights configuration
export const SCORE_WEIGHTS = {
  MEAL_TYPE_MATCH: 20,
  NUTRITIONAL_FIT_PERFECT: 15,
  NUTRITIONAL_FIT_GOOD: 10,
  NUTRITIONAL_FIT_OK: 5,
  COMPLEXITY_MATCH: 10,
  HISTORY_TOO_FREQUENT: -400, // Extreme penalty for 2+ repetitions (user request)
  HISTORY_REPEATED_ONCE: -150, // Heavy penalty for single repetition
  HISTORY_TOO_FREQUENT_CURATED: -200, // Heavy penalty for system foods
  HISTORY_TOO_FREQUENT_RECURRING: -50, // Moderate penalty for recurring foods appearing too often
  HISTORY_YESTERDAY: -400, // Heavy penalty for foods eaten yesterday (user request)
  HISTORY_FRESH: 15, // Bonus for variety (fresh foods not eaten recently)
  HISTORY_SAME_DAY_LAST_WEEK: 15, // Bonus for routine match
  CURATED_FOOD_BONUS: 0, // Bonus for system/curated foods (neutralized)
  RECURRING_COLLECTION_BONUS: 200, // Strong bonus to ensure recurring foods appear (user request: +200)
  RELATED_FOOD_BONUS: 20, // Related food bonus
  PANTRY_FULL: 15, // 100% ingredients available
  PANTRY_PARTIAL: 8, // 50-99% ingredients available
  MICRONUTRIENT_PENALTY_SEVERE: -100,
  MICRONUTRIENT_PENALTY: -50,
  MICRONUTRIENT_BONUS: 10,
  DAILY_REPEATED_CATEGORY: -100, // Heavy penalty for repeating category in same day
  SAME_DAY_REPEAT: -1000, // Extreme penalty for repeating in same day (user request)
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

      // Use nested loop instead of two-pointer to correctly handle serving sizes
      // and unsorted/shuffled arrays.
      // Performance note: With limit~100, 100*100 = 10,000 iterations per serving size.
      // 15 serving combos * 10,000 = 150,000 ops. Acceptable for backend logic.
      for (const mainFood of mainDishes) {
        const mainTotalNutrition = this.calculateTotalNutrition(
          mainFood,
          mainServing,
        );

        for (const sideFood of sideDishes) {
          const sideTotalNutrition = this.calculateTotalNutrition(
            sideFood,
            sideServing,
          );

          const totalCalories =
            mainTotalNutrition.calories + sideTotalNutrition.calories;

          // Optimization: Pre-check calories to avoid expensive calculations if way off
          // (Can't break/continue based on range if unsorted, so just check)
          if (
            totalCalories < nutritionRange.calories.from ||
            totalCalories > nutritionRange.calories.to
          ) {
            continue;
          }

          const totalProtein =
            mainTotalNutrition.protein + sideTotalNutrition.protein;
          const totalCarbs =
            mainTotalNutrition.carbs + sideTotalNutrition.carbs;
          const totalFat = mainTotalNutrition.fat + sideTotalNutrition.fat;

          if (
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
        }
        if (validCombinations.length >= maxCombinations) break;
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
   * Applies count-based scaling: more repetitions = heavier penalties
   * Special penalty for foods eaten yesterday
   */
  private calculateHistoryScore(
    food: Food,
    previousWeekFoodIds?: Map<string, number>,
    sameDayLastWeekFoodIds?: Set<string>,
    recurringBonusMap?: Map<string, number>,
    yesterdayFoodIds?: Set<string>,
  ): number {
    const foodId = food._id?.toString() ?? '';

    // Check for routine match first (same day last week)
    if (sameDayLastWeekFoodIds && sameDayLastWeekFoodIds.has(foodId)) {
      return SCORE_WEIGHTS.HISTORY_SAME_DAY_LAST_WEEK;
    }

    // Heavy penalty for foods eaten yesterday (priority check)
    if (yesterdayFoodIds && yesterdayFoodIds.has(foodId)) {
      return SCORE_WEIGHTS.HISTORY_YESTERDAY; // -400
    }

    if (!previousWeekFoodIds) return 0;

    const count = previousWeekFoodIds.get(foodId) ?? 0;

    if (count === 0) {
      // Fresh food not eaten recently - bonus for variety
      return SCORE_WEIGHTS.HISTORY_FRESH;
    }

    // Check if food is in recurring collection
    const isRecurringFood = recurringBonusMap?.has(foodId) ?? false;

    if (isRecurringFood) {
      // Recurring foods: light penalty for first appearance, then increase
      if (count === 1) {
        return -20; // Light penalty
      }
      // 2+ times: apply moderate penalty to encourage other recurring foods
      return SCORE_WEIGHTS.HISTORY_TOO_FREQUENT_RECURRING * count; // -50 * count
    }

    // Non-recurring foods: aggressive penalty based on count
    if (!food.isCustom) {
      // Curated/system foods
      if (count === 1) return -100; // First repetition - heavy penalty
      // 2+ times: extreme penalty (-400 * count)
      return SCORE_WEIGHTS.HISTORY_TOO_FREQUENT * count;
    }

    // Custom foods: always penalize repetition
    if (count === 1) {
      return SCORE_WEIGHTS.HISTORY_REPEATED_ONCE; // -150
    }
    // 2+ times: extreme penalty (-400 * count)
    return SCORE_WEIGHTS.HISTORY_TOO_FREQUENT * count;
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
   * Calculate micronutrient score (fiber, sodium, cholesterol)
   */
  private calculateMicronutrientScore(
    mainFood: Food,
    mainServing: number,
    sideFood: Food,
    sideServing: number,
    context: ScoringContext,
  ): number {
    if (!context.minFiber && !context.maxSodium && !context.maxCholesterol)
      return 0;

    let score = 0;
    const totals = {
      fiber:
        (mainFood.nutrition.fiber || 0) * mainServing +
        (sideFood.nutrition.fiber || 0) * sideServing,
      sodium:
        (mainFood.nutrition.sodium || 0) * mainServing +
        (sideFood.nutrition.sodium || 0) * sideServing,
      cholesterol:
        (mainFood.nutrition.cholesterol || 0) * mainServing +
        (sideFood.nutrition.cholesterol || 0) * sideServing,
    };

    // Sodium: Penalty if exceeds limit (Proportional)
    if (context.maxSodium && totals.sodium > context.maxSodium) {
      const excessRatio =
        (totals.sodium - context.maxSodium) / context.maxSodium;
      // Exponential penalty: small violation (10%) -> -20. Large violation (50%) -> -100.
      // Formula: excess * 200.
      score -= excessRatio * 200;
    }

    // Cholesterol: Penalty if exceeds limit (Proportional)
    if (context.maxCholesterol && totals.cholesterol > context.maxCholesterol) {
      const excessRatio =
        (totals.cholesterol - context.maxCholesterol) / context.maxCholesterol;
      score -= excessRatio * 200;
    }

    // Fiber: Bonus if meets target, Penalty if miss
    if (context.minFiber) {
      if (totals.fiber >= context.minFiber) {
        score += SCORE_WEIGHTS.MICRONUTRIENT_BONUS;
      } else {
        // Penalty for missing fiber?
        // If missing by a lot:
        const missingRatio =
          (context.minFiber - totals.fiber) / context.minFiber;
        // moderate penalty
        score -= missingRatio * 50;
      }
    }

    return score;
  }

  /**
   * Calculate daily variety score (penalize category repetition)
   */
  private calculateDailyVarietyScore(
    food: Food,
    usedCategoryIds?: Set<number>,
  ): number {
    if (!usedCategoryIds || usedCategoryIds.size === 0) return 0;
    if (!food.categories || food.categories.length === 0) return 0;

    let isRepeated = false;
    for (const cat of food.categories) {
      if (usedCategoryIds.has(cat)) {
        isRepeated = true;
        break;
      }
    }

    return isRepeated ? SCORE_WEIGHTS.DAILY_REPEATED_CATEGORY : 0;
  }

  /**
   * Calculate bonus for curated/system foods
   */
  private calculateCuratedScore(food: Food): number {
    return !food.isCustom ? SCORE_WEIGHTS.CURATED_FOOD_BONUS : 0;
  }

  /**
   * Calculate total score for a food combination
   */
  private calculateCombinationScore(
    mainFood: Food,
    mainServing: number,
    sideFood: Food,
    sideServing: number,
    totals: { calories: number; protein: number; carbs: number; fat: number },
    context: ScoringContext,
  ): { score: number; breakdown: ScoredCombination['scoreBreakdown'] } {
    const mainId = mainFood._id?.toString() ?? '';
    const sideId = sideFood._id?.toString() ?? '';

    // Check if this is a single-food meal (sideServing = 0)
    const isSingleFood = sideServing === 0;

    // Meal type match (average of main and side, or just main if single)
    const mealTypeMatch = isSingleFood
      ? this.calculateMealTypeScore(mainFood, context.mealType)
      : (this.calculateMealTypeScore(mainFood, context.mealType) +
          this.calculateMealTypeScore(sideFood, context.mealType)) /
        2;

    // Nutritional fit
    const nutritionalFit = this.calculateNutritionalFitScore(
      totals.calories,
      context.targetCalories,
    );

    // Complexity match (average of main and side, or just main if single)
    const complexityMatch = isSingleFood
      ? this.calculateComplexityScore(
          mainFood,
          context.mealType,
          context.isWeekend ?? false,
        )
      : (this.calculateComplexityScore(
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

    // History bonus (just main if single) - includes yesterday penalty
    const historyBonus = isSingleFood
      ? this.calculateHistoryScore(
          mainFood,
          context.previousWeekFoodIds,
          context.sameDayLastWeekFoodIds,
          context.recurringBonusMap,
          context.yesterdayFoodIds,
        )
      : (this.calculateHistoryScore(
          mainFood,
          context.previousWeekFoodIds,
          context.sameDayLastWeekFoodIds,
          context.recurringBonusMap,
          context.yesterdayFoodIds,
        ) +
          this.calculateHistoryScore(
            sideFood,
            context.previousWeekFoodIds,
            context.sameDayLastWeekFoodIds,
            context.recurringBonusMap,
            context.yesterdayFoodIds,
          )) /
        2;

    // Same-day repeat penalty (extreme penalty for using food already used today)
    let sameDayRepeatPenalty = 0;
    if (context.excludeFoodIdsForDay) {
      if (context.excludeFoodIdsForDay.has(mainId)) {
        sameDayRepeatPenalty += SCORE_WEIGHTS.SAME_DAY_REPEAT; // -500
      }
      if (!isSingleFood && context.excludeFoodIdsForDay.has(sideId)) {
        sameDayRepeatPenalty += SCORE_WEIGHTS.SAME_DAY_REPEAT; // -500
      }
    }

    // Pantry availability (just main if single)
    const pantryAvailability = isSingleFood
      ? this.calculatePantryScore(mainFood, context.pantryIngredientIds)
      : (this.calculatePantryScore(mainFood, context.pantryIngredientIds) +
          this.calculatePantryScore(sideFood, context.pantryIngredientIds)) /
        2;

    // Recurring Collection bonus (just main if single)
    const recurringBonus = isSingleFood
      ? context.recurringBonusMap?.get(mainId) || 0
      : ((context.recurringBonusMap?.get(mainId) || 0) +
          (context.recurringBonusMap?.get(sideId) || 0)) /
        2;

    // Micronutrient fit (pass 0 for side if single)
    const micronutrientFit = this.calculateMicronutrientScore(
      mainFood,
      mainServing,
      sideFood,
      isSingleFood ? 0 : sideServing,
      context,
    );

    const totalScore =
      mealTypeMatch +
      nutritionalFit +
      complexityMatch +
      historyBonus +
      sameDayRepeatPenalty +
      pantryAvailability +
      recurringBonus +
      micronutrientFit +
      (this.calculateDailyVarietyScore(mainFood, context.usedCategoryIdsToday) +
        (isSingleFood
          ? 0
          : this.calculateDailyVarietyScore(
              sideFood,
              context.usedCategoryIdsToday,
            )));

    return {
      score: totalScore,
      breakdown: {
        mealTypeMatch,
        nutritionalFit,
        complexityMatch,
        historyBonus,
        pantryAvailability,
        recurringBonus,
        micronutrientFit,
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

    // Take top K items (candidates)
    const candidates = sorted.slice(0, Math.min(topK, sorted.length));

    // Smart Filtering:
    // If we have a clear winner (e.g. Recurring food with +50 bonus),
    // we shouldn't dilute its chance by picking randomly from low-scoring items.
    // However, if scores are close, we want randomness.

    // Logic: Filter candidates that are within a certain range of the best score.
    // RECURRING_COLLECTION_BONUS is 100. Use a tighter threshold to prefer high-scoring items.
    const SCORE_THRESHOLD = 25;
    const bestScore = candidates[0].score;

    const viableCandidates = candidates.filter(
      (item) => item.score >= bestScore - SCORE_THRESHOLD,
    );

    // Random select from viable candidates
    const randomIndex = Math.floor(Math.random() * viableCandidates.length);
    return viableCandidates[randomIndex];
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
        categories: 1,
        property: 1,
      },
      { limit: 100 },
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
        categories: 1,
        property: 1,
      },
      { limit: 100 },
    );
  }

  async getMealsByCategories(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
    scoringContext?: ScoringContext,
  ): Promise<{
    mainDish: { food: Food; serving: number } | null;
    sideDish: { food: Food; serving: number } | null;
  }> {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    // HARD FILTER: Exclude foods already used today (prevent same-day repetition)
    // This ensures even the fallback mechanism respects the daily exclusion list
    let filteredMain = mainDishes;
    let filteredSide = sideDishes;

    const excludeForDay = scoringContext?.excludeFoodIdsForDay;
    if (excludeForDay && excludeForDay.size > 0) {
      filteredMain = mainDishes.filter(
        (f) => !excludeForDay.has(f._id?.toString() || ''),
      );
      filteredSide = sideDishes.filter(
        (f) => !excludeForDay.has(f._id?.toString() || ''),
      );
    }

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    filteredMain.sort(compareFood);
    filteredSide.sort(compareFoodReverse);

    const validCombinations = this.buildValidCombinations(
      filteredMain,
      filteredSide,
      nutritionRange,
      50, // Increased from 20 for more variety
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
    const [mainDishesFromDb, sideDishesFromDb] = await Promise.all([
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

    // Shuffle from DB to ensure variety before combination building
    // This prevents the same "first 50" combinations from always filling the buffer
    const shuffle = (array: Food[]) => array.sort(() => Math.random() - 0.5);

    // Inject recurring foods at the beginning (priority)
    const existingMainIds = new Set(
      mainDishesFromDb.map((f) => f._id?.toString()),
    );
    const existingSideIds = new Set(
      sideDishesFromDb.map((f) => f._id?.toString()),
    );

    const recurringMainToInject = shuffle(
      (scoringContext.recurringMainFoods || []).filter(
        (f) => !existingMainIds.has(f._id?.toString()),
      ),
    );
    const recurringSideToInject = shuffle(
      (scoringContext.recurringSideFoods || []).filter(
        (f) => !existingSideIds.has(f._id?.toString()),
      ),
    );

    // Put recurring foods first, then SHUFFLED db foods
    // IMPORTANT: Shuffle the DB foods so buildValidCombinations (which is greedy) doesn't always see the same order
    let mainDishes = [...recurringMainToInject, ...shuffle(mainDishesFromDb)];
    let sideDishes = [...recurringSideToInject, ...shuffle(sideDishesFromDb)];

    // Filter out foods already used today (prevent repetition in same day)
    const excludeForDayDb = scoringContext.excludeFoodIdsForDay;
    if (excludeForDayDb && excludeForDayDb.size > 0) {
      mainDishes = mainDishes.filter(
        (f) => !excludeForDayDb.has(f._id?.toString() || ''),
      );
      sideDishes = sideDishes.filter(
        (f) => !excludeForDayDb.has(f._id?.toString() || ''),
      );
    }

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    // Build Pair Combinations (Main + Side)
    const validCombinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      100, // Increased limit
    );

    // ALWAYS Build Single Food Combinations (Main only)
    // Don't wait for fallback. Single meals are valid and desired options.
    const singleServings = [1, 1.5, 2, 2.5, 3];
    // Check more main dishes for single potential
    for (const mainFood of mainDishes.slice(0, 50)) {
      for (const serving of singleServings) {
        const nutrition = this.calculateTotalNutrition(mainFood, serving);
        if (
          nutrition.calories >= nutritionRange.calories.from &&
          nutrition.calories <= nutritionRange.calories.to &&
          nutrition.protein >= nutritionRange.proteins.from &&
          nutrition.protein <= nutritionRange.proteins.to
        ) {
          // Create a "single food" combination with a null side placeholder
          validCombinations.push({
            mainDish: { food: mainFood, serving },
            sideDish: { food: mainFood, serving: 0 }, // Placeholder
            totals: {
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbs: nutrition.carbs,
              fat: nutrition.fat,
            },
            isSingleFood: true,
          } as (typeof validCombinations)[0] & { isSingleFood?: boolean });

          if (validCombinations.length >= 150) break; // Hard limit total
        }
      }
      if (validCombinations.length >= 150) break;
    }

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    // Hard filter for micronutrient limits if provided
    let combinationsToScore = validCombinations;
    if (
      scoringContext.minFiber ||
      scoringContext.maxSodium ||
      scoringContext.maxCholesterol
    ) {
      const meetsConstraints = (combo: (typeof validCombinations)[0]) => {
        const mainServing = combo.mainDish.serving;
        const sideServing = combo.sideDish.serving;
        const mainFood = combo.mainDish.food;
        const sideFood = combo.sideDish.food;
        const totals = {
          fiber:
            (mainFood.nutrition.fiber || 0) * mainServing +
            (sideFood.nutrition.fiber || 0) * sideServing,
          sodium:
            (mainFood.nutrition.sodium || 0) * mainServing +
            (sideFood.nutrition.sodium || 0) * sideServing,
          cholesterol:
            (mainFood.nutrition.cholesterol || 0) * mainServing +
            (sideFood.nutrition.cholesterol || 0) * sideServing,
        };

        if (
          scoringContext.maxSodium &&
          totals.sodium > scoringContext.maxSodium
        )
          return false;
        if (
          scoringContext.maxCholesterol &&
          totals.cholesterol > scoringContext.maxCholesterol
        )
          return false;
        if (scoringContext.minFiber && totals.fiber < scoringContext.minFiber)
          return false;
        return true;
      };

      const filteredCombinations = validCombinations.filter(meetsConstraints);
      // Only use filtered results if we have any; otherwise fall back to all
      if (filteredCombinations.length > 0) {
        combinationsToScore = filteredCombinations;
      }
    }

    // Calculate scores for each combination
    const scoredCombinations: ScoredCombination[] = combinationsToScore.map(
      (combo) => {
        const { score, breakdown } = this.calculateCombinationScore(
          combo.mainDish.food,
          combo.mainDish.serving,
          combo.sideDish.food,
          combo.sideDish.serving,
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
      // If sideDish serving is 0, it's a single-food meal
      sideDish: selected.sideDish.serving === 0 ? null : selected.sideDish,
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
    scoringContext?: ScoringContext,
  ) {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const maxCombinations = Math.max(limit * 20, 200);
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

    // If scoring context with micronutrient limits is provided, apply hard filtering then scoring
    if (
      scoringContext &&
      (scoringContext.minFiber ||
        scoringContext.maxSodium ||
        scoringContext.maxCholesterol)
    ) {
      // Helper to calculate micronutrient totals for a combo
      const getMicronutrientTotals = (combo: (typeof combinations)[0]) => {
        const mainServing = combo.mainDish.serving;
        const sideServing = combo.sideDish.serving;
        const mainFood = combo.mainDish.food;
        const sideFood = combo.sideDish.food;
        return {
          fiber:
            (mainFood.nutrition.fiber || 0) * mainServing +
            (sideFood.nutrition.fiber || 0) * sideServing,
          sodium:
            (mainFood.nutrition.sodium || 0) * mainServing +
            (sideFood.nutrition.sodium || 0) * sideServing,
          cholesterol:
            (mainFood.nutrition.cholesterol || 0) * mainServing +
            (sideFood.nutrition.cholesterol || 0) * sideServing,
        };
      };

      // Hard filter: exclude combinations that violate micronutrient limits
      const meetsConstraints = (combo: (typeof combinations)[0]) => {
        const totals = getMicronutrientTotals(combo);
        // Check hard limits - if any limit is violated, exclude
        if (
          scoringContext.maxSodium &&
          totals.sodium > scoringContext.maxSodium
        )
          return false;
        if (
          scoringContext.maxCholesterol &&
          totals.cholesterol > scoringContext.maxCholesterol
        )
          return false;
        if (scoringContext.minFiber && totals.fiber < scoringContext.minFiber)
          return false;
        return true;
      };

      // First, try to get combinations that meet all constraints
      const validCombinations = combinations.filter(meetsConstraints);

      // If we have valid combinations, score and return them
      if (validCombinations.length > 0) {
        const scoredCombinations = validCombinations.map((combo) => {
          const micronutrientScore = this.calculateMicronutrientScore(
            combo.mainDish.food,
            combo.mainDish.serving,
            combo.sideDish.food,
            combo.sideDish.serving,
            scoringContext,
          );
          return { ...combo, score: micronutrientScore };
        });
        scoredCombinations.sort((a, b) => b.score - a.score);
        return scoredCombinations.slice(0, limit);
      }

      // Fallback: if no combinations meet all constraints, return scored results (best effort)
      // This ensures we still return options even when constraints can't be fully satisfied
      const scoredCombinations = combinations.map((combo) => {
        const micronutrientScore = this.calculateMicronutrientScore(
          combo.mainDish.food,
          combo.mainDish.serving,
          combo.sideDish.food,
          combo.sideDish.serving,
          scoringContext,
        );
        return { ...combo, score: micronutrientScore };
      });
      scoredCombinations.sort((a, b) => b.score - a.score);
      return scoredCombinations.slice(0, limit);
    }

    return combinations.slice(0, limit);
  }

  async getMealsFromFoods(
    mainDishes: Food[],
    sideDishes: Food[],
    nutritionGoals: NutritionGoalsType,
    excludedCategoryIds?: Iterable<number>,
    scoringContext?: ScoringContext,
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

    let filteredMain = mainDishes.filter(isAllowed);
    let filteredSide = sideDishes.filter(isAllowed);

    // HARD FILTER: Exclude foods already used today (prevent same-day repetition)
    const excludeForDayLocal = scoringContext?.excludeFoodIdsForDay;
    if (excludeForDayLocal && excludeForDayLocal.size > 0) {
      filteredMain = filteredMain.filter(
        (f) => !excludeForDayLocal.has(f._id?.toString() || ''),
      );
      filteredSide = filteredSide.filter(
        (f) => !excludeForDayLocal.has(f._id?.toString() || ''),
      );
    }

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
      50,
    );

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    // If scoring context is provided, apply filtering and scoring logic
    if (scoringContext) {
      let combinationsToScore = validCombinations;

      // 1. Hard Filter Micronutrients
      if (
        scoringContext.minFiber ||
        scoringContext.maxSodium ||
        scoringContext.maxCholesterol
      ) {
        const meetsConstraints = (combo: (typeof validCombinations)[0]) => {
          const mainServing = combo.mainDish.serving;
          const sideServing = combo.sideDish.serving;
          const mainFood = combo.mainDish.food;
          const sideFood = combo.sideDish.food;
          const totals = {
            fiber:
              (mainFood.nutrition.fiber || 0) * mainServing +
              (sideFood.nutrition.fiber || 0) * sideServing,
            sodium:
              (mainFood.nutrition.sodium || 0) * mainServing +
              (sideFood.nutrition.sodium || 0) * sideServing,
            cholesterol:
              (mainFood.nutrition.cholesterol || 0) * mainServing +
              (sideFood.nutrition.cholesterol || 0) * sideServing,
          };

          if (
            scoringContext.maxSodium &&
            totals.sodium > scoringContext.maxSodium
          )
            return false;
          if (
            scoringContext.maxCholesterol &&
            totals.cholesterol > scoringContext.maxCholesterol
          )
            return false;
          if (scoringContext.minFiber && totals.fiber < scoringContext.minFiber)
            return false;
          return true;
        };

        const filtered = validCombinations.filter(meetsConstraints);
        if (filtered.length > 0) {
          combinationsToScore = filtered;
        }
      }

      // 2. Score Combinations
      const scoredCombinations: ScoredCombination[] = combinationsToScore.map(
        (combo) => {
          const { score, breakdown } = this.calculateCombinationScore(
            combo.mainDish.food,
            combo.mainDish.serving,
            combo.sideDish.food,
            combo.sideDish.serving,
            combo.totals,
            scoringContext,
          );
          return { ...combo, score, scoreBreakdown: breakdown };
        },
      );

      // 3. Select Top-K
      const selected = this.selectTopKRandom(scoredCombinations, 5);
      return selected || { mainDish: null, sideDish: null };
    }

    // Default behavior without scoring
    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
  }

  /**
   * Generate flexible meal options with 1, 2, or 3 items
   * Used for deep search to find combos that best fit remaining nutrition
   */
  async getFlexibleMealOptions(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    limit: number,
    excludeFoodIds: Set<string>,
    targetItemCount?: number,
    scoringContext?: ScoringContext,
  ): Promise<
    Array<{
      items: Array<{ food: Food; serving: number }>;
      totals: { calories: number; protein: number; carbs: number; fat: number };
    }>
  > {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType),
      this.getSideDishes(sideCategories, mealType),
    ]);

    const allFoods = [...mainDishes, ...sideDishes].filter(
      (food) => !excludeFoodIds.has(food._id.toString()),
    );

    const nutritionRange = this.calculateNutritionRange(nutritionGoals, 0.1); // Relaxed 10% tolerance
    const servingSizes = [0.5, 0.75, 1, 1.25, 1.5, 2];

    type FlexibleComboInternal = {
      items: Array<{ food: Food; serving: number }>;
      totals: { calories: number; protein: number; carbs: number; fat: number };
      score: number;
    };

    const results: FlexibleComboInternal[] = [];
    const seenKeys = new Set<string>();

    const isInRange = (totals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }) =>
      totals.calories >= nutritionRange.calories.from &&
      totals.calories <= nutritionRange.calories.to &&
      totals.protein >= nutritionRange.proteins.from &&
      totals.protein <= nutritionRange.proteins.to &&
      totals.carbs >= nutritionRange.carbs.from &&
      totals.carbs <= nutritionRange.carbs.to &&
      totals.fat >= nutritionRange.fats.from &&
      totals.fat <= nutritionRange.fats.to;

    // Calculate micronutrient totals for flexible combos (supporting 1-3 items)
    const calculateFlexibleMicronutrientScore = (
      items: Array<{ food: Food; serving: number }>,
      context: ScoringContext,
    ): number => {
      if (!context.minFiber && !context.maxSodium && !context.maxCholesterol)
        return 0;

      const totals = items.reduce(
        (acc, { food, serving }) => ({
          fiber: acc.fiber + (food.nutrition.fiber || 0) * serving,
          sodium: acc.sodium + (food.nutrition.sodium || 0) * serving,
          cholesterol:
            acc.cholesterol + (food.nutrition.cholesterol || 0) * serving,
        }),
        { fiber: 0, sodium: 0, cholesterol: 0 },
      );

      let score = 0;

      // Sodium: Penalty if exceeds limit
      if (context.maxSodium && totals.sodium > context.maxSodium) {
        const excessRatio =
          (totals.sodium - context.maxSodium) / context.maxSodium;
        score -= excessRatio * 200;
      }

      // Cholesterol: Penalty if exceeds limit
      if (
        context.maxCholesterol &&
        totals.cholesterol > context.maxCholesterol
      ) {
        const excessRatio =
          (totals.cholesterol - context.maxCholesterol) /
          context.maxCholesterol;
        score -= excessRatio * 200;
      }

      // Fiber: Bonus if meets target, penalty if misses
      if (context.minFiber) {
        if (totals.fiber >= context.minFiber) {
          score += 10; // Bonus
        } else {
          const missingRatio =
            (context.minFiber - totals.fiber) / context.minFiber;
          score -= missingRatio * 50;
        }
      }

      return score;
    };

    const calcScore = (
      totals: { calories: number },
      items: Array<{ food: Food; serving: number }>,
    ) => {
      const targetCal = nutritionGoals.calories;
      // Base score: calorie deviation (lower is better)
      let baseScore = Math.abs(totals.calories - targetCal) / (targetCal || 1);

      // If scoring context provided, add micronutrient score (negative score increases baseScore = worse)
      if (scoringContext) {
        const microScore = calculateFlexibleMicronutrientScore(
          items,
          scoringContext,
        );
        // Invert microScore: positive microScore should reduce baseScore (better)
        // Micronutrient score range roughly -200 to +10, normalize to similar scale as calorie deviation
        baseScore -= microScore / 200;
      }

      return baseScore;
    };

    const addCombo = (items: Array<{ food: Food; serving: number }>) => {
      const key = items
        .map((i) => `${i.food._id}-${i.serving}`)
        .sort()
        .join('|');
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const totals = items.reduce(
        (acc, { food, serving }) => {
          const nut = this.calculateTotalNutrition(food, serving);
          return {
            calories: acc.calories + nut.calories,
            protein: acc.protein + nut.protein,
            carbs: acc.carbs + nut.carbs,
            fat: acc.fat + nut.fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

      if (isInRange(totals)) {
        results.push({ items, totals, score: calcScore(totals, items) });
      }
    };

    const allow1 = !targetItemCount || targetItemCount === 1;
    const allow2 = !targetItemCount || targetItemCount === 2;
    const allow3 = !targetItemCount || targetItemCount === 3;

    // 1-item combos
    if (allow1) {
      for (const food of allFoods) {
        for (const serving of servingSizes) {
          addCombo([{ food, serving }]);
          if (results.length >= limit * 3) break;
        }
        if (results.length >= limit * 3) break;
      }
    }

    // 2-item combos (existing logic)
    if (allow2) {
      const maxPerCategory = Math.min(50, allFoods.length);
      for (let i = 0; i < maxPerCategory && results.length < limit * 5; i++) {
        for (
          let j = i + 1;
          j < maxPerCategory && results.length < limit * 5;
          j++
        ) {
          const food1 = allFoods[i];
          const food2 = allFoods[j];
          for (const s1 of [1, 0.5, 1.5]) {
            for (const s2 of [1, 0.5, 1.5]) {
              addCombo([
                { food: food1, serving: s1 },
                { food: food2, serving: s2 },
              ]);
            }
          }
        }
      }
    }

    // 3-item combos (limit iterations for performance)
    if (allow3) {
      const max3Item = Math.min(30, allFoods.length);
      outer: for (let i = 0; i < max3Item; i++) {
        for (let j = i + 1; j < max3Item; j++) {
          for (let k = j + 1; k < max3Item; k++) {
            addCombo([
              { food: allFoods[i], serving: 1 },
              { food: allFoods[j], serving: 1 },
              { food: allFoods[k], serving: 0.5 },
            ]);
            addCombo([
              { food: allFoods[i], serving: 1 },
              { food: allFoods[j], serving: 0.5 },
              { food: allFoods[k], serving: 1 },
            ]);
            if (results.length >= limit * 8) break outer;
          }
        }
      }
    }

    // Sort by score (lower is better), take top results
    results.sort((a, b) => a.score - b.score);

    // If scoring context provided, apply hard filtering for micronutrient constraints
    if (
      scoringContext &&
      (scoringContext.minFiber ||
        scoringContext.maxSodium ||
        scoringContext.maxCholesterol)
    ) {
      // Helper to check if combo meets micronutrient constraints
      const meetsConstraints = (combo: FlexibleComboInternal) => {
        const microTotals = combo.items.reduce(
          (acc, { food, serving }) => ({
            fiber: acc.fiber + (food.nutrition.fiber || 0) * serving,
            sodium: acc.sodium + (food.nutrition.sodium || 0) * serving,
            cholesterol:
              acc.cholesterol + (food.nutrition.cholesterol || 0) * serving,
          }),
          { fiber: 0, sodium: 0, cholesterol: 0 },
        );

        if (
          scoringContext.maxSodium &&
          microTotals.sodium > scoringContext.maxSodium
        )
          return false;
        if (
          scoringContext.maxCholesterol &&
          microTotals.cholesterol > scoringContext.maxCholesterol
        )
          return false;
        if (
          scoringContext.minFiber &&
          microTotals.fiber < scoringContext.minFiber
        )
          return false;
        return true;
      };

      // First, filter for combinations that meet all constraints
      const validResults = results.filter(meetsConstraints);

      // If we have valid results, return them; otherwise fall back to all results (best effort)
      if (validResults.length > 0) {
        return validResults
          .slice(0, limit)
          .map(({ items, totals }) => ({ items, totals }));
      }
    }

    return results
      .slice(0, limit)
      .map(({ items, totals }) => ({ items, totals }));
  }
}
