// src/categories/categories.controller.ts

import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @User('username') username: string) {
    return this.categoriesService.create(createCategoryDto, username);
  }
  
  @Get()
  findAll(@User('username') username: string) {
    return this.categoriesService.findAll(username);
  }
  
  // Endpoint lainnya (update dan delete) bisa ditambahkan di service
  // ...
}