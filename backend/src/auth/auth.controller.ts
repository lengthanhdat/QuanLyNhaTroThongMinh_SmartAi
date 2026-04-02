import { Controller, Post, Body, Get, Patch, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: any) {
    return this.authService.register(dto);
  }

  @Post('register-tenant')
  async registerTenant(@Body() dto: any) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: { email: string, code: string }) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('login')
  async login(@Body() dto: any) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('google')
  async googleLogin(@Body('token') token: string) {
    if (!token) throw new UnauthorizedException('Token is required');
    return this.authService.verifyGoogleToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Request() req, @Body() dto: any) {
    return this.authService.updateMe(req.user.id, dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: any) {
    return this.authService.resetPassword(dto);
  }
}
