import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entities/contract.entity';
import { Room } from '../entities/room.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private mailerService: MailerService,
  ) {}

  async create(createContractDto: any) {
    const contract = this.contractRepository.create(createContractDto);
    const saved = (await this.contractRepository.save(contract)) as unknown as Contract;
    
    // When a contract is created, the room is no longer available
    if (saved.room?.id) {
      await this.roomRepository.update(saved.room.id, { status: 'rented' });
    }
    
    return saved;
  }

  findAll() {
    return this.contractRepository.find({ relations: ['room', 'tenant', 'invoices'] });
  }

  findOne(id: number) {
    return this.contractRepository.findOne({ where: { id }, relations: ['room', 'tenant', 'invoices'] });
  }

  async update(id: number, updateDto: any) {
    await this.contractRepository.update(id, updateDto);
    const contract = await this.findOne(id) as Contract | null;
    
    // If contract becomes active, update room status and send email
    if (updateDto.status === 'active' && contract?.room?.id) {
      await this.roomRepository.update(contract.room.id, { status: 'rented' });
      
      // Send contract email with PDF attachment
      if (contract.tenant?.email) {
        this.sendContractEmail(contract).catch(err => {
          console.error('Failed to send contract email:', err);
        });
      }
    } else if (updateDto.status === 'ended' && contract?.room?.id) {
      await this.roomRepository.update(contract.room.id, { status: 'available' });
    }
    
    return contract;
  }

  private async generateContractPdf(contract: Contract): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    const roomName = contract.room?.name || '---';
    const electricityRate = parseInt(contract.electricityRate?.toString() || '0').toLocaleString();
    const waterRate = parseInt(contract.waterRate?.toString() || '0').toLocaleString();
    const price = contract.price?.toLocaleString();
    const deposit = contract.deposit?.toLocaleString();
    const startDate = contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '---';
    const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '---';
    const createdAt = new Date(contract.createdAt);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          body { font-family: 'Times New Roman', Times, serif; padding: 50px; line-height: 1.5; color: #1e293b; background: white; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0; font-size: 14px; font-weight: 700; font-style: italic; }
          .title { text-align: center; margin: 40px 0; font-weight: 900; font-size: 20px; text-transform: uppercase; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 15px 0; letter-spacing: 2px; }
          .intro { margin-bottom: 25px; font-size: 13px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: 800; text-transform: uppercase; font-size: 12px; border-left: 4px solid #2563eb; padding-left: 10px; background: #f8fafc; margin-bottom: 10px; padding-top: 4px; padding-bottom: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; padding-left: 15px; font-size: 13px; }
          .info-item { margin-bottom: 4px; }
          .terms-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0; font-size: 13px; }
          .term-row { display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding: 6px 0; }
          .term-row:last-child { border-bottom: none; }
          .term-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 11px; }
          .term-value { font-weight: 800; color: #1e293b; }
          .responsibility { font-size: 12px; color: #475569; }
          .responsibility h4 { font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 5px; font-size: 11px; }
          .responsibility ul { padding-left: 15px; margin: 5px 0; list-style-type: "– "; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; page-break-inside: avoid; }
          .sig-box { text-align: center; }
          .sig-title { font-weight: 800; text-transform: uppercase; font-size: 12px; margin-bottom: 2px; }
          .sig-subtitle { font-size: 10px; color: #94a3b8; margin-bottom: 15px; }
          .sig-stamp { border: 2px dashed #bfdbfe; background: #eff6ff; padding: 15px; border-radius: 15px; color: #3b82f6; display: flex; flex-direction: column; align-items: center; gap: 4px; }
          .sig-stamp.tenant { border-color: #a7f3d0; background: #ecfdf5; color: #059669; }
          .sig-text { font-size: 9px; font-weight: 800; text-transform: uppercase; }
          .sig-date { font-size: 9px; opacity: 0.8; }
          .sig-name { margin-top: 15px; font-weight: 800; font-style: italic; font-size: 12px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); font-weight: 900; pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="watermark">SMART TRỌ</div>

        <div class="header">
          <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
          <p>Độc lập – Tự do – Hạnh phúc</p>
          <div style="margin: 15px auto; width: 150px; height: 1px; background: #e2e8f0;"></div>
        </div>

        <div class="title">HỢP ĐỒNG THUÊ PHÒNG</div>

        <div class="intro">
          Hôm nay ngày <b>${createdAt.getDate()}</b> tháng <b>${createdAt.getMonth() + 1}</b> năm <b>${createdAt.getFullYear()}</b>; tại địa chỉ: <b style="color:#000;">${contract.propertyAddress}.</b>
        </div>

        <div class="section">
          <div class="section-title">1. ĐẠI DIỆN BÊN CHO THUÊ (BÊN A):</div>
          <div class="info-grid">
            <div class="info-item">Ông/bà: <b>${contract.landlordName}</b></div>
            <div class="info-item">Sinh ngày: <b>${contract.landlordDob}</b></div>
            <div class="info-item" style="grid-column: span 2;">Địa chỉ: <b>${contract.landlordAddress}</b></div>
            <div class="info-item">CMND số: <b>${contract.landlordCccd}</b></div>
            <div class="info-item">Số điện thoại: <b>${contract.landlordPhone}</b></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. BÊN THUÊ PHÒNG TRỌ (BÊN B):</div>
          <div class="info-grid">
            <div class="info-item">Ông/bà: <b>${contract.tenantName || contract.tenant?.fullName || '---'}</b></div>
            <div class="info-item">Sinh ngày: <b>${contract.tenantDob || '---'}</b></div>
            <div class="info-item" style="grid-column: span 2;">Địa chỉ: <b>${contract.tenantAddress || '---'}</b></div>
            <div class="info-item">Số CMND: <b>${contract.tenantCccd || '---'}</b></div>
            <div class="info-item">Số điện thoại: <b>${contract.tenantPhone || '---'}</b></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. ĐIỀU KHOẢN THUÊ PHÒNG:</div>
          <div style="font-size: 13px; margin: 10px 0;">Bên A đồng ý cho bên B thuê 01 phòng ở tại: <b>Phòng ${roomName} – ${contract.propertyAddress}</b></div>
          
          <div class="terms-box">
            <div class="term-row">
              <span class="term-label">Giá thuê:</span>
              <span class="term-value" style="color:#2563eb;">${price} đ/tháng</span>
            </div>
            <div class="term-row">
              <span class="term-label">Tiền đặt cọc:</span>
              <span class="term-value">${deposit} đ</span>
            </div>
            <div class="term-row">
              <span class="term-label">Ngày bắt đầu:</span>
              <span class="term-value">${startDate}</span>
            </div>
            <div class="term-row">
              <span class="term-label">Ngày kết thúc:</span>
              <span class="term-value">${endDate}</span>
            </div>
            <div class="term-row">
              <span class="term-label">Tiền điện:</span>
              <span class="term-value" style="color:#2563eb;">${electricityRate} đ/kwh</span>
            </div>
            <div class="term-row">
              <span class="term-label">Tiền nước:</span>
              <span class="term-value" style="color:#2563eb;">${waterRate} đ/người</span>
            </div>
          </div>
        </div>

        <div class="responsibility">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4>* TRÁCH NHIỆM BÊN A:</h4>
              <ul>
                <li>Tạo mọi điều kiện thuận lợi để bên B thực hiện hợp đồng.</li>
                <li>Cung cấp nguồn điện, nước, wifi đầy đủ.</li>
              </ul>
            </div>
            <div>
              <h4>* TRÁCH NHIỆM BÊN B:</h4>
              <ul>
                <li>Thanh toán đầy đủ các khoản tiền đúng hạn.</li>
                <li>Bảo quản trang thiết bị và giữ vệ sinh chung.</li>
                <li>Chấp hành mọi quy định của pháp luật.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <p class="sig-title">ĐẠI DIỆN BÊN A</p>
            <p class="sig-subtitle">(Bên cho thuê)</p>
            <div class="sig-stamp">
              <span style="font-size: 20px;">✔️</span>
              <span class="sig-text">ĐÃ KÝ ĐIỆN TỬ</span>
              <span class="sig-date">${createdAt.toLocaleDateString('vi-VN')}</span>
            </div>
            <p class="sig-name">${contract.landlordName}</p>
          </div>
          <div class="sig-box">
            <p class="sig-title">ĐẠI DIỆN BÊN B</p>
            <p class="sig-subtitle">(Bên thuê)</p>
            <div class="sig-stamp tenant">
              <span style="font-size: 20px;">✔️</span>
              <span class="sig-text">ĐÃ XÁC NHẬN</span>
              <span class="sig-date">${new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <p class="sig-name">${contract.tenantName || contract.tenant?.fullName}</p>
          </div>
        </div>

        <div style="margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          Hợp đồng này được bảo mật và mã hóa số bởi hệ thống quản lý Smart Trọ.
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async sendContractEmail(contract: Contract) {
    const pdfBuffer = await this.generateContractPdf(contract);
    const roomName = contract.room?.name || 'Phòng Trọ';

    await this.mailerService.sendMail({
      to: contract.tenant.email,
      subject: `[Smart Trọ] Bản sao Hợp đồng thuê phòng ${roomName} của bạn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 35px;">
            <h1 style="color: #1e40af; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Smart Trọ</h1>
            <p style="color: #64748b; margin-top: 4px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Digital Contract Confirmation</p>
          </div>
          
          <div style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
            <p style="color: #0f172a; font-size: 16px; line-height: 1.6;">Chào <strong>${contract.tenantName || contract.tenant.fullName}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Bạn đã hoàn tất việc ký kết hợp đồng thuê <strong>Phòng ${roomName}</strong> thành công. Đây là bản tóm tắt thông tin quan trọng:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Mã phòng:</td>
                  <td style="padding: 6px 0; color: #1e40af; font-size: 15px; font-weight: 800; text-align: right;">${roomName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Giá thuê:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 15px; font-weight: 800; text-align: right;">${contract.price.toLocaleString()} VNĐ</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Ngày ký kết:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 15px; font-weight: 800; text-align: right;">${new Date().toLocaleDateString('vi-VN')}</td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">* Vui lòng xem và lưu trữ <strong>tệp đính kèm (PDF)</strong> trong email này. Đây là bản hợp đồng chính thức có giá trị pháp lý của bạn.</p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin-bottom: 4px;">Trân trọng,</p>
            <p style="color: #64748b; font-weight: 800; font-size: 14px; margin-top: 0;">Đội ngũ Smart Trọ</p>
            <p style="margin-top: 15px;">© 2026 Smart Trọ. Secured by Advanced Encryption Standard.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Hop_Dong_Thue_Phong_${roomName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  findAllByTenant(tenantId: number) {
    return this.contractRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'invoices'],
    });
  }

  async remove(id: number) {
    const contract = await this.findOne(id);
    if (contract?.room?.id) {
      await this.roomRepository.update(contract.room.id, { status: 'available' });
    }
    return this.contractRepository.delete(id);
  }
}
