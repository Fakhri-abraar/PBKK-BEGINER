// src/categories/categories.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, ownerId: string) {
    // this.prisma.category sudah tersedia setelah generate
    return this.prisma.category.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }
  
  // FIX: Implementasi findAll
  async findAll(ownerId: string) {
    return this.prisma.category.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }
  
  // ... (implementasi findOne, update, delete)
}