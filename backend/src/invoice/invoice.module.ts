import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { MailModule } from '../mail/mail.module';
import { Invoice } from '../entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), MailModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService]
})
export class InvoiceModule {}
