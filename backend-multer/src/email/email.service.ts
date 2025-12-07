// src/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private transporter: Mail;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Konfigurasi diambil dari .env melalui ConfigService
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE') ?? false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendTaskReminder(to: string, taskTitle: string, dueDate: Date) {
    try {
      const mailOptions = {
        from: '"Todo Reminders" <noreply@todoapp.com>',
        to: to,
        subject: `[REMINDER] Tugas: ${taskTitle} jatuh tempo besok!`,
        html: `<p>Hai, tugas <b>${taskTitle}</b> Anda akan jatuh tempo pada ${dueDate.toDateString()}. Selesaikan tepat waktu!</p>`,
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}