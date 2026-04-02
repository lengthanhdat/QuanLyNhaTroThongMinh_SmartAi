import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../tenant/tenant.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private client: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private tenantService: TenantService,
    private mailerService: MailerService,
  ) {
    this.client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(dto: any) {
    const existing = await this.tenantService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const tenant = await this.tenantService.create({
      ...dto,
      fullName: dto.name || dto.fullName,
      password: hashedPassword,
      isVerified: false,
      verificationCode: otp,
    });

    // Send real OTP email
    await this.sendOtpEmail(dto.email, dto.name || dto.fullName, otp);

    const jwtResponse = this.generateJwt(tenant);
    return jwtResponse;
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '🔐 Mã xác thực Smart Trọ của bạn',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #e2e2e2;">
              <tr>
                <td style="background: linear-gradient(135deg, #003d9b 0%, #0052cc 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1px; font-family: Arial, sans-serif;">Smart<span style="color: #b2c5ff;">Trọ</span></h1>
                  <p style="margin: 8px 0 0; color: #dae2ff; font-size: 14px; font-weight: 500; opacity: 0.9;">Hệ thống quản lý không gian sống thông minh</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="margin: 0 0 12px; font-size: 24px; color: #1a1c1c; font-weight: 800;">Xin chào, ${name || 'Bạn'}! 👋</h2>
                  <p style="color: #434654; margin: 0 0 32px; font-size: 16px; line-height: 1.6; font-weight: 500;">
                    Cảm ơn bạn đã tin tưởng Smart Trọ. Vui lòng sử dụng mã OTP 6 số dưới đây để hoàn tất hồ sơ xác thực của bạn.
                  </p>

                  <div style="background-color: #f3f3f4; border: 2px dashed #0052cc; border-radius: 20px; padding: 32px; text-align: center; margin: 0 0 32px;">
                    <p style="margin: 0 0 12px; color: #737685; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; font-weight: 800;">Mã OTP của bạn</p>
                    <div style="font-size: 56px; font-weight: 900; color: #003d9b; letter-spacing: 16px; font-family: 'Courier New', Courier, monospace;">${otp}</div>
                  </div>

                  <div style="background-color: #fff9f0; border-left: 4px solid #ffb59b; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 0 0 32px;">
                    <p style="margin: 0; color: #7b2600; font-size: 13px; line-height: 1.5; font-weight: 600;">
                      🚨 <strong>Lưu ý:</strong> Mã này có hiệu lực trong <strong>10 phút</strong>. Để an toàn, tuyệt đối không chia sẻ mã này với bất kỳ ai (kể cả nhân viên BQL).
                    </p>
                  </div>

                  <p style="color: #737685; font-size: 12px; text-align: center; margin: 0; font-weight: 500;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f3f3f4; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e2e2;">
                  <p style="margin: 0; color: #737685; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    © 2026 Smart Trọ · Công nghệ quản lý nhà trọ tiên phong
                  </p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
      console.log(`[Mailer] OTP sent to ${email}`);
    } catch (err) {
      console.error('[Mailer] Failed to send OTP email:', err.message);
      // Don't throw - registration still succeeds, but log the failure
    }
  }

  async verifyOtp(email: string, code: string) {
    const tenant = await this.tenantService.findByEmail(email);
    if (!tenant) throw new UnauthorizedException('Email không tồn tại');
    
    const storedCode = await this.tenantService.getVerificationCode(tenant.id);
    if (storedCode !== code) throw new UnauthorizedException('Mã OTP không chính xác');

    await this.tenantService.update(tenant.id, { 
      isVerified: true, 
      verificationCode: null 
    });

    return { message: 'Xác thực thành công!' };
  }

  async login(email: string, pass: string) {
    const tenant = await this.tenantService.findByEmailWithPassword(email);
    if (!tenant || !tenant.password) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (!tenant.isVerified && tenant.role !== 'admin') {
      throw new UnauthorizedException('Tài khoản chưa được xác thực email');
    }

    const isMatch = await bcrypt.compare(pass, tenant.password);
    if (!isMatch) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    return this.generateJwt(tenant);
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw new UnauthorizedException('Token Google không hợp lệ');

      let tenant = await this.tenantService.findByEmail(payload.email);
      if (!tenant) {
        tenant = await this.tenantService.create({
          fullName: payload.name,
          email: payload.email,
          googleId: payload.sub,
          isVerified: true,
        });
      } else if (!tenant.googleId) {
        await this.tenantService.update(tenant.id, { 
          googleId: payload.sub,
          isVerified: true
        });
      }

      return this.generateJwt(tenant);
    } catch (e) {
      throw new UnauthorizedException('Lỗi xác thực Google: ' + e.message);
    }
  }

  async forgotPassword(email: string) {
    const tenant = await this.tenantService.findByEmail(email);
    if (!tenant) throw new ConflictException('Email không tồn tại trong hệ thống');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    await this.tenantService.update(tenant.id, {
      resetOtp: otp,
      resetOtpExpiry: expiry,
    });

    await this.sendResetPasswordEmail(email, tenant.fullName, otp);
    return { message: 'Mã khôi phục đã được gửi đến email của bạn' };
  }

  async resetPassword(dto: any) {
    const { email, otp, newPassword } = dto;
    // To get the resetOtp field, we might need a special find method if it's normally hidden,
    // but the current findByEmail includes it since it's not marked select: false.
    const tenant = await this.tenantService.findByEmail(email);
    
    if (!tenant || tenant.resetOtp !== otp) {
      throw new UnauthorizedException('Mã khôi phục không chính xác');
    }

    if (new Date() > tenant.resetOtpExpiry) {
      throw new UnauthorizedException('Mã khôi phục đã hết hạn (15 phút)');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.tenantService.update(tenant.id, {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  async sendResetPasswordEmail(email: string, name: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '🔑 Khôi phục mật khẩu Smart Trọ của bạn',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #e2e2e2;">
              <tr>
                <td style="background: linear-gradient(135deg, #003d9b 0%, #0052cc 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1px; font-family: Arial, sans-serif;">Smart<span style="color: #b2c5ff;">Trọ</span></h1>
                  <p style="margin: 8px 0 0; color: #dae2ff; font-size: 14px; font-weight: 500; opacity: 0.9;">Yêu cầu khôi phục quyền truy cập</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="margin: 0 0 12px; font-size: 24px; color: #1a1c1c; font-weight: 800;">Xin chào, ${name || 'Bạn'}! 🔑</h2>
                  <p style="color: #434654; margin: 0 0 32px; font-size: 16px; line-height: 1.6; font-weight: 500;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác nhận dưới đây để hoàn tất quá trình này.
                  </p>

                  <div style="background-color: #f3f3f4; border: 2px dashed #0052cc; border-radius: 20px; padding: 32px; text-align: center; margin: 0 0 32px;">
                    <p style="margin: 0 0 12px; color: #737685; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; font-weight: 800;">Mã khôi phục của bạn</p>
                    <div style="font-size: 56px; font-weight: 900; color: #003d9b; letter-spacing: 16px; font-family: 'Courier New', Courier, monospace;">${otp}</div>
                  </div>

                  <div style="background-color: #fff9f0; border-left: 4px solid #ffb59b; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 0 0 32px;">
                    <p style="margin: 0; color: #7b2600; font-size: 13px; line-height: 1.5; font-weight: 600;">
                      🚨 <strong>Lưu ý:</strong> Mã này có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này và đảm bảo tài khoản của bạn vẫn an toàn.
                    </p>
                  </div>

                  <p style="color: #737685; font-size: 12px; text-align: center; margin: 0; font-weight: 500;">Đây là email tự động, vui lòng không trả lời.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f3f3f4; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e2e2;">
                  <p style="margin: 0; color: #737685; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    © 2026 Smart Trọ · Bảo mật là ưu tiên hàng đầu
                  </p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
    } catch (err) {
      console.error('[Mailer] Failed to send recovery email:', err.message);
    }
  }

  async updateMe(id: number, dto: any) {
    return this.tenantService.update(id, dto);
  }

  generateJwt(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role || 'tenant' };
    return {
      access_token: this.jwtService.sign(payload),
      user: { 
        id: user.id, 
        name: user.fullName, 
        email: user.email, 
        role: user.role || 'tenant',
        phone: user.phone,
        cccd: user.cccd,
        emergencyContact: user.emergencyContact
      }
    };
  }
}
