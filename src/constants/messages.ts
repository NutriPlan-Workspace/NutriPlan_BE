export const ERROR_MESSAGE = {
  INVALID_EMAIL: 'Invalid email format',
  EMAIL_ALREADY_IN_USE: 'Email is already in use',
  INVALID_PHONE_NUMBER: 'Invalid phone number',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_MISSING_UPPERCASE:
    'Password must contain at least one uppercase letter!',
  PASSWORD_MISSING_LOWERCASE:
    'Password must contain at least one lowercase letter!',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number!',
  PASSWORD_MISSING_SPECIAL:
    'Password must contain at least one special character!',
  FULLNAME_TOO_SHORT: 'Fullname must be at least 3 characters long',
  FULLNAME_CANNOT_BE_NUMBERS: 'Fullname cannot be only numbers',
  HEIGHT_TOO_SMALL: 'Height must be at least 50 cm',
  WEIGHT_TOO_SMALL: 'Weight must be at least 10 kg',
  INVALID_LOGOUT: 'Invalid to logout',
  INVALID_LOGIN: 'Invalid email or password',
  INVALID_PARAMETER: 'Invalid request parameters',
  INVALID_TOKEN: 'Invalid token',
  NO_TOKEN_PROVIDED: 'No access token provided',
  AUTH_ERROR: 'Access is denied',
  ERROR: 'Error',
  USER: {
    CHANGE_PASSWORD: {
      INCORRECT_OLD_PASSWORD: 'Old password is incorrect',
    },
    NOT_FOUND: 'User not found',
    UPDATE_FAILED: 'Failed to update user',
  },
  NOT_FOUND: '404 Not Found',
  SERVER_ERROR: 'Internal server error',
  TITLE_REQUIRED: 'Title is required',
  FIBER_NUMBER: 'Minimum fiber must be a positive number',
  MAX_SODIUM: 'Maximum sodium must be a positive number',
  MAX_CHOLESTEROL: 'Maximum cholesterol must be a positive number',
  CALORIES_NUMBER: 'Calories must be a positive number',
  FROM_NUMBER: 'From must be a positive number',
  TO_NUMBER: 'To must be a positive number',
  FROM_LESS_THAN_TO: 'From must be less than To',
  INVALID_OBJECTID: 'Invalid ObjectId',
  INVALID_IMG_URL: 'Invalid image URL format',
  INVALID_FILTERS: 'Filters must be an array containing only:',
  INVALID_ALLSEARCH: 'allSearch must not be empty',
  INVALID_PREFERRED_FOOD:
    'preferredFoodTypes must be an array containing only:',
  RANGE_TOO_LARGE: 'Day range must be less than 7 days',
  INVALID_RANGE: 'Invalid day range',
  NAME_REQUIRED: 'Name is required',
  INVALID_IMAGE_URL: 'Each image URL must be a valid URL',
  INVALID_VIDEO_URL: 'Video URL must be a valid URL',
  INVALID_TYPE:
    'Invalid type. Allowed values are customFood, customRecipe, or create.',
  INGREDIENTS_REQUIRED: 'Ingredients are required to create a custom recipe.',
};

export const SUCCESS_MESSAGE = {
  LOGIN_SUCCESS: 'Login success',
  LOGOUT_SUCCESS: 'Logout success',
  REQUEST_SUCCESS: 'Request successful',
  REGISTER_SUCCESS: 'User created successfully',
  COLLECTION_DELETED_SUCCESS: 'Collection deleted successfully',
};
