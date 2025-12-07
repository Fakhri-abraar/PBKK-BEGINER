// src/auth/jwt.strategy.ts (VERSI DENGAN VALIDASI MINIMAL)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// Hapus import class-validator dan class-transformer sementara

import { PrismaService } from '../prisma.service';
// Hapus import JwtPayloadDto

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Pastikan ini sama persis dengan AuthModule
      secretOrKey: 'your-secret-key', 
    });
  }

  // Payload adalah objek yang Anda tandatangani saat login
  async validate(payload: any) {
    
    // ASUMSI PENTING: Saat login, Anda menandatangani token dengan { sub: username }
    const username = payload.sub;

    if (!username) {
        throw new UnauthorizedException('Token payload is missing the username (sub).');
    }

    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      // Ini akan terjadi jika user sudah dihapus dari DB, tapi tokennya masih ada
      throw new UnauthorizedException('User not found or token invalid.');
    }

    // Nilai yang dikembalikan ini akan dimasukkan ke request.user
    return { userId: user.username, username: user.username };
  }
}