import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { InvoiceModule } from '../invoice/invoice.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [InvoiceModule, MailModule],
  controllers: [VnpayController],
  providers: [VnpayService],
  exports: [VnpayService],
})
export class VnpayModule {}
