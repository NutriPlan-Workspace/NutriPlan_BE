import { z } from 'zod';

import { FOOD_TYPES } from '@/constants/createFood';
import { ERROR_MESSAGE } from '@/constants/messages';

const NutritionSchema = z
  .object({
    carbs: z.number().default(0),
    fat: z.number().default(0),
    proteins: z.number().default(0),
    calories: z.number().default(0),
    netCarbs: z.number().default(0),
    caffeine: z.number().default(0),
    theobromine: z.number().default(0),
    fiber: z.number().default(0),
    calcium: z.number().default(0),
    iron: z.number().default(0),
    magnesium: z.number().default(0),
    phosphorus: z.number().default(0),
    potassium: z.number().default(0),
    sodium: z.number().default(0),
    zinc: z.number().default(0),
    copper: z.number().default(0),
    fluoride: z.number().default(0),
    manganese: z.number().default(0),
    selenium: z.number().default(0),
    vitAIu: z.number().default(0),
    vitA: z.number().default(0),
    vitB6: z.number().default(0),
    vitB12: z.number().default(0),
    vitC: z.number().default(0),
    vitDIu: z.number().default(0),
    vitD: z.number().default(0),
    vitD2: z.number().default(0),
    vitD3: z.number().default(0),
    vitE: z.number().default(0),
    vitK: z.number().default(0),
    retinol: z.number().default(0),
    lycopene: z.number().default(0),
    thiamine: z.number().default(0),
    riboflavin: z.number().default(0),
    niacin: z.number().default(0),
    folate: z.number().default(0),
    choline: z.number().default(0),
    betaCarotene: z.number().default(0),
    alphaCarotene: z.number().default(0),
    cholesterol: z.number().default(0),
    betaine: z.number().default(0),
    sugar: z.number().default(0),
    sucrose: z.number().default(0),
    glucose: z.number().default(0),
    fructose: z.number().default(0),
    lactose: z.number().default(0),
    maltose: z.number().default(0),
    galactose: z.number().default(0),
    starch: z.number().default(0),
    alcohol: z.number().default(0),
    water: z.number().default(0),
    tryptophan: z.number().default(0),
    threonine: z.number().default(0),
    isoleucine: z.number().default(0),
    leucine: z.number().default(0),
    lysine: z.number().default(0),
    methionine: z.number().default(0),
    cystine: z.number().default(0),
    phenylalanine: z.number().default(0),
    tyrosine: z.number().default(0),
    valine: z.number().default(0),
    arginine: z.number().default(0),
    histidine: z.number().default(0),
    alanine: z.number().default(0),
    asparticAcid: z.number().default(0),
    glycine: z.number().default(0),
    proline: z.number().default(0),
    serine: z.number().default(0),
    hydroxyproline: z.number().default(0),
    transFats: z.number().default(0),
    saturatedFats: z.number().default(0),
    monounsaturatedFats: z.number().default(0),
    polyunsaturatedFats: z.number().default(0),
    alaFattyAcid: z.number().default(0),
    dhaFattyAcid: z.number().default(0),
    epaFattyAcid: z.number().default(0),
    dpaFattyAcid: z.number().default(0),
    totalOmega3: z.number().default(0),
    totalOmega6: z.number().default(0),
  })
  .default({});

const PropertySchema = z
  .object({
    veggieServings: z.number().default(0),
    fruitServings: z.number().default(0),
    numberOfIngredients: z.number().default(0),
    singleServing: z.boolean().default(false),
    canBeBulk: z.boolean().default(false),
    keepsWell: z.boolean().default(false),
    allowPublic: z.boolean().default(false),
    needsBlender: z.boolean().default(false),
    needsOven: z.boolean().default(false),
    needsStove: z.boolean().default(false),
    needsSlowCooker: z.boolean().default(false),
    needsToaster: z.boolean().default(false),
    needsFoodProcessor: z.boolean().default(false),
    needsMicrowave: z.boolean().default(false),
    needsGrill: z.boolean().default(false),
    blatantlyUnhealthy: z.boolean().default(false),
    prepDayBefore: z.boolean().default(false),
    complexity: z.number().default(0),
    mainDish: z.boolean().default(true),
    sideDish: z.boolean().default(false),
    perishable: z.boolean().default(false),
    expirationTime: z.number().default(0),
    isBasicFood: z.boolean().default(false),
    prepTime: z.number().default(0),
    waitTime: z.number().default(0),
    totalTime: z.number().default(0),
    isBreakfast: z.boolean().default(false),
    isLunch: z.boolean().default(false),
    isDinner: z.boolean().default(false),
    isSnack: z.boolean().default(false),
    isDessert: z.boolean().default(false),
    majorIngredients: z.string().default(''),
  })
  .default({});

export const FoodSchema = z.object({
  name: z.string().nonempty(ERROR_MESSAGE.NAME_REQUIRED),
  imgUrls: z.array(z.string().url(ERROR_MESSAGE.INVALID_IMAGE_URL)).optional(),
  nutrition: NutritionSchema,
  property: PropertySchema,
  videoUrl: z.string().url(ERROR_MESSAGE.INVALID_VIDEO_URL).optional(),
  defaultUnit: z.number().default(0).optional(),
  units: z.array(
    z.object({
      amount: z.number(),
      description: z.string(),
    }),
  ),
  directions: z.array(z.object({ step: z.string() })).optional(),
  ingredients: z
    .array(
      z.object({
        ingredientFoodId: z.string(),
        amount: z.number(),
        unit: z.number(),
        preparation: z.string().optional(),
      }),
    )
    .optional(),
  description: z.string().optional(),
  isRecipe: z.boolean().default(true),
  isCustom: z.boolean().default(true),
  categories: z.array(z.number()).optional(),
  type: z.enum(FOOD_TYPES, {
    errorMap: () => ({ message: ERROR_MESSAGE.INVALID_TYPE }),
  }),
});

export const FoodUpdateSchema = z.object({
  name: z.string().nonempty(ERROR_MESSAGE.NAME_REQUIRED).optional(),
  imgUrls: z.array(z.string().url(ERROR_MESSAGE.INVALID_IMAGE_URL)).optional(),
  nutrition: NutritionSchema.optional(),
  property: PropertySchema.optional(),
  videoUrl: z.string().url(ERROR_MESSAGE.INVALID_VIDEO_URL).optional(),
  defaultUnit: z.number().optional(),
  units: z
    .array(
      z.object({
        amount: z.number(),
        description: z.string(),
      }),
    )
    .optional(),
  directions: z.array(z.object({ step: z.string() })).optional(),
  ingredients: z
    .array(
      z.object({
        ingredientFoodId: z.string(),
        amount: z.number(),
        unit: z.number(),
        preparation: z.string().optional(),
      }),
    )
    .optional(),
  description: z.string().optional(),
  isRecipe: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  categories: z.array(z.number()).optional(),
  type: z
    .enum(FOOD_TYPES, {
      errorMap: () => ({ message: ERROR_MESSAGE.INVALID_TYPE }),
    })
    .optional(),
});

export type FoodInput = z.infer<typeof FoodSchema>;
export type FoodUpdateInput = z.infer<typeof FoodUpdateSchema>;
