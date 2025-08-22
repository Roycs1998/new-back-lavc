import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Event Platform API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'Multi-tenant event management platform',
    version: process.env.SWAGGER_VERSION || '1.0.0',
  },
}));
