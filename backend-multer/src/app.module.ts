// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; 

import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
// Hapus import PrismaModule jika Anda hanya menggunakan PrismaService
// import { PrismaModule } from './prisma/prisma.module'; 
import { PrismaService } from './prisma.service'; // Tambahkan ini jika Anda menggunakannya di app.module (opsional)

import { TasksModule } from './tasks/tasks.module'; 
import { CategoriesModule } from './categories/categories.module'; 
import { EmailModule } from './email/email.module'; 
import { SchedulerModule } from './scheduler/scheduler.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), 
    
    // Auth, Upload, dan Modul baru
    AuthModule,
    UploadModule,
    TasksModule, 
    CategoriesModule, 
    EmailModule, 
    SchedulerModule, 
  ],
  controllers: [],
  providers: [PrismaService], // Sertakan PrismaService jika tidak menggunakan PrismaModule
})
export class AppModule {}