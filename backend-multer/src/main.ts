// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    transform: true, 
    forbidNonWhitelisted: true, 
  }));
  
  app.setGlobalPrefix('api/v1');

  await app.listen(3000); 
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();