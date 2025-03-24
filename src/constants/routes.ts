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
    GETALL: '/:id',
    ADD: '/add',
    GETBYDATE: '/:date/:userId',
    GETBYWEEK: '/week/:date/:userId',
    GETBYRANGE: '/:from/:to/:userId',
    EDIT: '/edit',
    DELETE: '/:foodId',
  },
  API_DOCS: '/api-docs',
};
