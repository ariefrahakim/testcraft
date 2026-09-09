import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { setupSwagger, SWAGGER_PATH } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  const prefix = config.get<string>('apiPrefix')!;
  const port = config.get<number>('port')!;
  const origins = config.get<string[]>('corsOrigins')!;

  app.setGlobalPrefix(prefix, { exclude: [SWAGGER_PATH] });
  // Swagger UI butuh inline script/style, jadi CSP dimatikan di route dokumentasi.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API   → http://localhost:${port}/${prefix}`);
  logger.log(`Docs  → http://localhost:${port}/${SWAGGER_PATH}`);
  logger.log(`CORS  → ${origins.join(', ')}`);
}

void bootstrap();
