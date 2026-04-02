import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class VnpayService {
  constructor(private configService: ConfigService) {}

  createPaymentUrl(amount: number, orderInfo: string, orderId: string, ipAddr: string = '127.0.0.1'): string {
    const tmnCode = this.configService.get<string>('VNP_TMNCODE')?.trim();
    const secretKey = this.configService.get<string>('VNP_HASHSECRET')?.trim();
    const vnpUrl = this.configService.get<string>('VNP_URL')?.trim();
    const returnUrl = this.configService.get<string>('VNP_RETURNURL')?.trim();

    const date = new Date();
    const createDate = this.formatDate(date);
    
    const vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `${orderId}_${createDate}`,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.floor(amount * 100).toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort params alphabetically by KEY
    const sortedKeys = Object.keys(vnpParams).sort();
    
    // Build the signData string using raw values (unencoded) for hashing in Version 2.1.0
    const signData = sortedKeys
      .map(key => `${key}=${encodeURIComponent(vnpParams[key].toString()).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Construct the final redirect URL
    return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
  }

  verifyReturnUrl(query: any): boolean {
    const secretKey = this.configService.get<string>('VNP_HASHSECRET')?.trim() || '';
    const vnp_SecureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedKeys = Object.keys(query).sort();
    const signData = sortedKeys
        .map(key => `${key}=${encodeURIComponent(query[key].toString()).replace(/%20/g, '+')}`)
        .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return signed === vnp_SecureHash;
  }

  private formatDate(date: Date): string {
    // Force to GMT+7 regardless of server timezone
    const vnDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (7 * 3600000));
    
    const yyyy = vnDate.getFullYear();
    const mm = String(vnDate.getMonth() + 1).padStart(2, '0');
    const dd = String(vnDate.getDate()).padStart(2, '0');
    const hh = String(vnDate.getHours()).padStart(2, '0');
    const min = String(vnDate.getMinutes()).padStart(2, '0');
    const sec = String(vnDate.getSeconds()).padStart(2, '0');
    
    return `${yyyy}${mm}${dd}${hh}${min}${sec}`;
  }
}
