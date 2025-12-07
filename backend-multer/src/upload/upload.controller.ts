// src/upload/upload.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('files') 
export class UploadController {
  @Post('upload') 
  @UseGuards(JwtAuthGuard) 
  @UseInterceptors(
    FileInterceptor('file', { 
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
            // Gambar
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            // Dokumen
            'application/pdf', 'text/plain', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'application/vnd.ms-excel', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
             const errorMessage = 'Only image and common document files are allowed';
             return callback(
                new BadRequestException(errorMessage),
                false,
            );
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            'file-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File upload failed or file is missing.');
    }
    
    return {
      imagePath: file.filename, 
      message: 'File uploaded successfully', 
    };
  }
}