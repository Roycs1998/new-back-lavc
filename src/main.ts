import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port', 3001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: nodeEnv === 'production',
    }),
  );

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global pipes with enhanced validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
      skipMissingProperties: false,
      validateCustomDecorators: true,
    }),
  );

  /* // Global filters and interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  ); */

  // CORS configuration
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? ['https://lavc.com', 'https://www.lavc.com', 'https://app.lavc.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger documentation (only in non-production)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .setContact(swaggerConfig.contact.name, '', swaggerConfig.contact.email)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Ingresa tu token JWT (sin "Bearer ")',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(`http://localhost:${port}/`, 'Desarrollo Local')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
      `,
      customSiteTitle: 'LAVC API Documentation',
    });

    logger.log(
      `📚 Documentación Swagger disponible en: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }

  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: nodeEnv,
      version: swaggerConfig.version,
    });
  });

  await app.listen(port);

  logger.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  logger.log(`🎯 API Base URL: http://localhost:${port}/${apiPrefix}`);
  logger.log(
    `🎯 Swagger disponible: http://localhost:${port}/${apiPrefix}/docs`,
  );
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`🌍 Entorno: ${nodeEnv}`);
}
bootstrap();
