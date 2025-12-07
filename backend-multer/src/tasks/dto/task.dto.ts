// src/tasks/dto/task.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsIn, IsUUID, IsBoolean, IsDateString } from 'class-validator';

// 4.1.1. CREATE Task
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high'; // 4.1.1. Priority

  @IsOptional()
  @IsDateString()
  dueDate?: string; // 4.1.1. Due date

  @IsOptional()
  @IsUUID()
  categoryId?: string; // 4.1.1. Category/tag

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false; // 4.1.7. Publikasi task
}

// 4.1.4. & 4.1.5. UPDATE Task
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // 4.1.4. Toggle task completion status
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean; 
  
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}