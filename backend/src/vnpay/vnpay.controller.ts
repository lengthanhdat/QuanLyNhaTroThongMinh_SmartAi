import { Controller, Get, Query, Res } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { Response } from 'express';
import { InvoiceService } from '../invoice/invoice.service';
import { MailService } from '../mail/mail.service';

@Controller('vnpay')
export class VnpayController {
  constructor(
    private vnpayService: VnpayService,
    private invoiceService: InvoiceService,
    private mailService: MailService,
  ) {}

  @Get('create-payment')
  createPayment(@Query('amount') amount: number, @Query('orderInfo') orderInfo: string, @Query('invoiceId') invoiceId: string) {
    return { url: this.vnpayService.createPaymentUrl(amount, orderInfo, invoiceId) };
  }

  @Get('vnpay-return')
  async verifyPayment(@Query() query: any, @Res() res: Response) {
    const isValid = this.vnpayService.verifyReturnUrl(query);
    if (isValid) {
      if (query['vnp_ResponseCode'] === '00') {
        const amount = Number(query['vnp_Amount']) / 100;
        const txnRef = query['vnp_TxnRef'];
        const invoiceId = Number(txnRef.split('_')[0]);
        
        // Update Invoice status in DB
        await this.invoiceService.update(invoiceId, { 
          status: 'paid', 
          paidAt: new Date(),
          paymentMethod: 'vnpay'
        });

        // Send success email
        const invoice = await this.invoiceService.findOne(invoiceId);
        if (invoice) {
          this.mailService.sendPaymentSuccess(invoice).catch(err => console.error('Email error:', err));
        }
        
        return res.redirect(`http://localhost:3000/tenant/payment-success?status=success&amount=${amount}&invoiceId=${invoiceId}`);
      } else {
        return res.redirect(`http://localhost:3000/tenant/payment-success?status=error&code=${query['vnp_ResponseCode']}`);
      }
    } else {
      return res.status(400).send('Invalid signature');
    }
  }

  @Get('vnpay-ipn')
  async vnpayIpn(@Query() query: any) {
    const isValid = this.vnpayService.verifyReturnUrl(query);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const txnRef = query['vnp_TxnRef'];
    const invoiceId = Number(txnRef.split('_')[0]);
    const responseCode = query['vnp_ResponseCode'];

    const invoice = await this.invoiceService.findOne(invoiceId);
    if (!invoice) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Check if order already confirmed
    if (invoice.status === 'paid') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (responseCode === '00') {
      // Update Invoice status
      await this.invoiceService.update(invoiceId, { 
        status: 'paid', 
        paidAt: new Date(),
        paymentMethod: 'vnpay'
      });
      if (invoice) {
        this.mailService.sendPaymentSuccess(invoice).catch(err => console.error('IPN Email error:', err));
      }
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      return { RspCode: '00', Message: 'Confirm Success' }; // VNPAY expects 00 even for failed payments if IPN is received
    }
  }
}
