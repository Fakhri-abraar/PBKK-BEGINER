import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateTokens(username: string) {
    const payload = { username, sub: username };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Add a unique identifier (jti) to ensure each refresh token is unique
    const refreshPayload = {
      ...payload,
      jti: `${username}-${Date.now()}-${Math.random()}`,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(username: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { username },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = this.generateTokens(user.username);
    await this.updateRefreshToken(user.username, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user.username);
    await this.updateRefreshToken(user.username, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        username: user.username,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken) as {
        username: string;
        sub: string;
        jti: string;
      };
      const user = await this.prisma.user.findUnique({
        where: { username: payload.username },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify the entire refresh token matches the stored hash
      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens with rotation
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user.username);
      await this.updateRefreshToken(user.username, newRefreshToken);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(username: string) {
    await this.prisma.user.update({
      where: { username },
      data: { refreshToken: null },
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
