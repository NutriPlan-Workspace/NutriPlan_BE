import swaggerJsDoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from '@/configs/env';
import {
  API_DESCRIPTION,
  API_TITLE,
  API_VERSION,
  BEARER_AUTH,
  SWAGGER_TAGS,
} from '@/constants/swagger';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: API_TITLE,
      version: API_VERSION,
      description: API_DESCRIPTION,
    },
    servers: [{ url: env.SERVER_URL }],
    tags: SWAGGER_TAGS,
    components: {
      securitySchemes: {
        BearerAuth: BEARER_AUTH,
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['src/routes/*.ts'],
};

const swaggerSpec = swaggerJsDoc(options);

export { swaggerSpec, swaggerUi };
