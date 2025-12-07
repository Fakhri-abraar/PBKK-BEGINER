// src/tasks/dto/task-query.dto.ts

import { IsOptional, IsString, IsInt, Min, IsBoolean, IsIn, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Tambahkan Enum untuk Priority
export enum TaskPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export class TaskQueryDto {
    @IsOptional()
    @IsString()
    // FIX: Mengganti 'title' menjadi 'search' 
    search?: string; 

    @IsOptional()
    @IsEnum(TaskPriority) 
    priority?: TaskPriority; 

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isCompleted?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10; 
    
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1; 

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder: 'asc' | 'desc' = 'desc';
}