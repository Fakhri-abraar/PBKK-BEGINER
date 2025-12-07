// src/tasks/tasks.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { User } from 'src/common/decorators/user.decorator';

// CATATAN PENTING:
// Semua konfigurasi Multer (diskStorage, FileInterceptor, UploadedFile)
// sudah DIHAPUS dari controller ini untuk memisahkan tanggung jawab.
// Tugas utama file upload ditangani oleh UploadController.

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard) 
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @User('username') username: string,
  ) {
    // filePath di set null karena upload file terpisah
    return this.tasksService.create(createTaskDto, username, null); 
  }

  @UseGuards(JwtAuthGuard) 
  @Get()
  findAllMine(@Query() query: TaskQueryDto, @User('username') username: string) {
    // Menggunakan DTO baru dengan filter, search, dan pagination
    return this.tasksService.findAll(query, username, true);
  }

  @Get('public') 
  findAllPublic(@Query() query: TaskQueryDto) {
    // Menggunakan DTO baru dengan filter, search, dan pagination
    return this.tasksService.findAll(query, undefined, false);
  }

  @UseGuards(JwtAuthGuard) 
  @Get(':id')
  findOne(@Param('id') id: string, @User('username') username: string) {
    return this.tasksService.findOne(id, username);
  }

  @UseGuards(JwtAuthGuard) 
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @User('username') username: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, username);
  }

  @UseGuards(JwtAuthGuard) 
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @User('username') username: string) {
    return this.tasksService.remove(id, username);
  }
}