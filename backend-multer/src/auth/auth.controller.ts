import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { handlePrismaError } from '../common/prisma-error.handler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      handlePrismaError(error, 'register user');
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      handlePrismaError(error, 'login user');
    }
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshToken(refreshTokenDto);
    } catch (error) {
      handlePrismaError(error, 'refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: { user: JwtPayloadDto }) {
    try {
      return await this.authService.logout(req.user.username);
    } catch (error) {
      handlePrismaError(error, 'logout user');
    }
  }
}
