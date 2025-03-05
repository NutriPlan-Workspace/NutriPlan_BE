export const API_TITLE = 'NutriPlan API';
export const API_VERSION = '1.0.0';
export const API_DESCRIPTION = 'API documentation for NutriPlan project';

export const SWAGGER_TAGS = [
  {
    name: 'Auth',
    description: 'APIs related to authentication',
  },
  {
    name: 'Users',
    description: 'APIs for user management',
  },
];

export const BEARER_AUTH = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};
