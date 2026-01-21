export const API_TITLE = 'NutriPlan API';
export const API_VERSION = '1.0.0';
export const API_DESCRIPTION = 'API documentation for NutriPlan project';

export const SWAGGER_TAGS = [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Users', description: 'User management' },
  { name: 'MealPlan', description: 'Meal planning operations' },
  { name: 'Pantry', description: 'Pantry management' },
  { name: 'Foods', description: 'Food database operations' },
  { name: 'Collections', description: 'Recipe collections' },
  { name: 'Articles', description: 'Nutrition articles' },
  { name: 'Categories', description: 'Food categories' },
  { name: 'Analytics', description: 'Usage tracking' },
  { name: 'AI', description: 'AI assistant features' },
];

export const BEARER_AUTH = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};
