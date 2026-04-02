import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Invoice } from '../entities/invoice.entity';
import { SettingService } from '../setting/setting.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly settingService: SettingService,
  ) {}

  async sendPaymentSuccess(invoice: Invoice) {
    const settings = await this.settingService.getAll();
    if (settings['autoSendEmail'] !== 'true') return;

    const tenant = invoice.contract?.tenant;
    if (!tenant?.email) return;

    const buildingName = settings['buildingName'] || 'SmartTrọ';

    await this.mailerService.sendMail({
      to: tenant.email,
      subject: `[${buildingName}] Xác nhận thanh toán thành công - Tháng ${invoice.month}/${invoice.year}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0052cc; padding: 30px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SmartTrọ AI</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8; font-weight: 600; text-transform: uppercase; tracking: 1px;">Xác nhận biên lai điện tử</p>
          </div>
          <div style="padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background-color: #f0fdf4; border-radius: 50%; display: inline-block; line-height: 60px; color: #16a34a; font-size: 30px;">✓</div>
              <h2 style="color: #1e293b; margin-top: 20px; font-weight: 800;">Thanh toán thành công!</h2>
              <p style="color: #64748b; font-size: 15px;">Cảm ơn ${tenant.fullName} đã hoàn tất thanh toán tiền phòng.</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-bottom: 10px;">PHÒNG</td>
                  <td style="text-align: right; color: #1e293b; font-weight: 700; padding-bottom: 10px;">${invoice.contract?.room?.name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-bottom: 10px;">KỲ HẠN</td>
                  <td style="text-align: right; color: #1e293b; font-weight: 700; padding-bottom: 10px;">Tháng ${invoice.month}/${invoice.year}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-bottom: 10px;">PHƯƠNG THỨC</td>
                  <td style="text-align: right; color: #1e293b; font-weight: 700; padding-bottom: 10px;">${invoice.paymentMethod || 'Chuyển khoản'}</td>
                </tr>
                <tr style="border-top: 1px dashed #e2e8f0;">
                  <td style="color: #1e293b; font-size: 15px; font-weight: 800; padding-top: 15px;">TỔNG CỘNG</td>
                  <td style="text-align: right; color: #0052cc; font-size: 18px; font-weight: 900; padding-top: 15px;">${invoice.totalAmount.toLocaleString()}đ</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p>Hóa đơn được xử lý tự động bởi hệ thống quản lý SmartTrọ.<br>Mọi thắc mắc vui lòng liên hệ Ban quản lý: ${settings['phone'] || ''}</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b;">
            &copy; 2026 ${buildingName}. All rights reserved.
          </div>
        </div>
      `,
    });
  }

  async sendPaymentReminder(invoice: Invoice) {
    const settings = await this.settingService.getAll();
    const tenant = invoice.contract?.tenant;
    if (!tenant?.email) return;

    const buildingName = settings['buildingName'] || 'SmartTrọ';
    const loginLink = `http://localhost:3000/tenant/invoices`;
    const invoiceType = invoice.type === 'initial' ? 'TIỀN CỌC PHÒNG' : 'TIỀN PHÒNG HÀNG THÁNG';

    await this.mailerService.sendMail({
      to: tenant.email,
      subject: `[${buildingName}] Nhắc nhở thanh toán: ${invoiceType} - Tháng ${invoice.month}/${invoice.year}`,
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 97, 255, 0.05), 0 10px 10px -5px rgba(0, 97, 255, 0.02);">
            
            <!-- Header with Premium Blue Gradient -->
            <div style="background: linear-gradient(135deg, #0061ff 0%, #60a5fa 100%); padding: 50px 30px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);">
                <span style="font-size: 36px;">📜</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.01em; text-transform: uppercase;">THÔNG BÁO THANH TOÁN</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">SmartTrọ Intelligent System</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 45px 40px;">
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.01em;">Thân chào ${tenant.fullName},</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin-bottom: 35px;">
                Chúng tôi gửi thông báo này để nhắc bạn về khoản <strong style="color: #0061ff; font-weight: 800;">${invoiceType}</strong> 
                thuộc <strong>Phòng ${invoice.contract?.room?.name}</strong> cho kỳ thanh toán <strong>Tháng ${invoice.month}/${invoice.year}</strong>.
              </p>

              <!-- AeroGlass Info Card -->
              <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; margin-bottom: 35px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 14px;">
                  <span style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Loại hóa đơn</span>
                  <span style="color: #1e293b; font-size: 14px; font-weight: 800;">${invoiceType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 14px;">
                  <span style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Hạn chót đóng</span>
                  <span style="color: #ef4444; font-size: 14px; font-weight: 800;">${new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 6px;">
                  <span style="color: #475569; font-size: 16px; font-weight: 700;">TỔNG CỘNG</span>
                  <span style="color: #0061ff; font-size: 24px; font-weight: 900;">${invoice.totalAmount.toLocaleString()}đ</span>
                </div>
              </div>

              <!-- Primary CTA -->
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${loginLink}" style="display: inline-block; background: #0061ff; color: #ffffff; padding: 20px 50px; border-radius: 20px; font-weight: 800; text-decoration: none; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 15px 30px -5px rgba(0, 97, 255, 0.3); transition: all 0.2s ease; text-transform: uppercase;">
                  XEM & THANH TOÁN NGAY
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center; font-weight: 500;">
                Mọi thắc mắc về hóa đơn, vui lòng liên hệ Ban quản lý:<br>
                <strong style="color: #64748b; font-weight: 700;">Hotline: ${settings['phone'] || 'Chưa cập nhật'}</strong>
              </p>
            </div>

            <!-- Refined Footer -->
            <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #cbd5e1; font-size: 11px; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                &copy; 2026 ${buildingName} — Powered by SmartTrọ AI
              </p>
            </div>
          </div>
        </div>
      `,
    });
  }
}
