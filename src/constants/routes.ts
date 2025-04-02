export const ROUTES = {
  ROOT: {
    PATH: '/api',
  },
  AUTH: {
    PATH: '/auth',
    LOGIN: '/login',
    LOGOUT: '/logout',
    REGISTER: '/register',
  },
  MEALPLAN: {
    PATH: '/planner',
    ADD: '/',
    GET: '/',
    EDIT: '/:id',
    DELETE: '/:id',
  },
  USER: {
    PATH: '/user',
    CHANGE_PASSWORD: '/change-password',
    NUTRITION_TARGET: '/nutrition-target',
    GETSTAST: '/stats',
    EDITSTAST: '/stats',
  },
  API_DOCS: '/api-docs',
};
