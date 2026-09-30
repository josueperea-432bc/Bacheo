import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  const origins = [
    'http://localhost:5174',
  ];

  if (process.env.FRONTEND_URL) {
    const adicionales =
      process.env.FRONTEND_URL
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean);

    origins.push(...adicionales);
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const uploadsPath =
    join(process.cwd(), 'uploads');

  mkdirSync(
    join(uploadsPath, 'reportes'),
    { recursive: true },
  );

  mkdirSync(
    join(uploadsPath, 'evidencias'),
    { recursive: true },
  );

  app.useStaticAssets(
    uploadsPath,
    {
      prefix: '/uploads/',
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port =
    Number(process.env.PORT ?? 3000);

  await app.listen(
    port,
    '0.0.0.0',
  );
}

void bootstrap();
