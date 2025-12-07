// src/scheduler/scheduler.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule'; // Hapus CronExpression
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Fix: Gunakan string CRON '0 8 * * *' (Setiap hari jam 8 pagi)
  @Cron('0 8 * * *') 
  async handleTaskReminders() {
    this.logger.log('Running task deadline reminders...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // this.prisma.task sudah tersedia setelah generate
    const tasksToRemind = await this.prisma.task.findMany({ 
      where: {
        isCompleted: false,
        dueDate: {
          gte: tomorrow, 
          lt: dayAfterTomorrow,
        },
      },
      include: { author: { select: { email: true } } }, 
    });

    for (const task of tasksToRemind) {
      // FIX: Cek apakah task.author.email dan task.dueDate (Date | null) ada
      if (task.author.email && task.dueDate) { 
        await this.emailService.sendTaskReminder(
          task.author.email,
          task.title,
          task.dueDate, // task.dueDate sekarang dijamin bertipe Date
        );
      }
    }
  }
}