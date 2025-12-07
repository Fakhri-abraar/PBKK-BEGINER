// src/common/decorators/user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // Asumsi req.user diisi oleh JwtAuthGuard
    
    // Kembalikan properti spesifik ('username') atau seluruh objek user
    return data ? user?.[data] : user;
  },
);