// src/scheduler/scheduler.module.ts

import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma.service'; // Sesuaikan path
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule], // Import EmailModule
  providers: [SchedulerService, PrismaService],
})
export class SchedulerModule {}