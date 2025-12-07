// src/types/task.ts

import { Category } from './category';

export interface Author {
  username: string;
  email: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  isCompleted: boolean;
  isPublic: boolean;
  filePath: string | null;
  
  // FIX: Menggunakan string | null agar sesuai dengan database (string untuk tanggal, null jika tidak diisi)
  dueDate: string | null; 
  
  createdAt: string;
  updatedAt: string;
  
  authorId: string;
  author: Author; 
  
  categoryId: string;
  category: Category;
}

export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorId' | 'category' | 'filePath'>;

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
    categoryId?: string;
    dueDate?: string | null; // FIX PENTING: dueDate mungkin opsional saat update
};