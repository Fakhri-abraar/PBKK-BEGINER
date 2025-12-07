// src/categories/categories.module.ts

import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../prisma.service'; // Sesuaikan path

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService] // Eksport jika modul lain membutuhkannya
})
export class CategoriesModule {}