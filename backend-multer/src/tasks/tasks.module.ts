// src/tasks/tasks.module.ts (Pastikan nama file ini benar)

import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service'; // Menggunakan TasksService
import { TasksController } from './tasks.controller'; // Menggunakan TasksController
import { PrismaService } from '../prisma.service'; // Path ke src/prisma.service.ts
import { UploadModule } from '../upload/upload.module'; 

@Module({
  imports: [UploadModule],
  controllers: [TasksController],
  providers: [TasksService, PrismaService],
})
export class TasksModule {}