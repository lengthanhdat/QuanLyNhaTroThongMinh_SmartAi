import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private mailService: MailService,
  ) {}

  findAllByTenant(tenantId: number) {
    return this.invoiceRepository.find({
      where: { contract: { tenant: { id: tenantId } } },
      relations: ['contract', 'contract.room', 'contract.tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  findUnpaidByTenant(tenantId: number) {
    return this.invoiceRepository.find({
      where: { 
        contract: { tenant: { id: tenantId } },
        status: 'unpaid' 
      },
      relations: ['contract', 'contract.room', 'contract.tenant'],
    });
  }

  findAll() {
    return this.invoiceRepository.find({
      relations: ['contract', 'contract.room', 'contract.tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.invoiceRepository.findOne({
      where: { id },
      relations: ['contract', 'contract.room', 'contract.tenant'],
    });
  }

  async create(data: any) {
    // If contractId is provided separately, map it to the contract relationship
    const { contractId, ...rest } = data;
    const invoice = this.invoiceRepository.create({
      ...rest,
      contract: contractId ? { id: contractId } : undefined,
    });
    return this.invoiceRepository.save(invoice);
  }

  async update(id: number, data: any) {
    const { contractId, ...rest } = data;
    const updateData = {
      ...rest,
      contract: contractId ? { id: contractId } : undefined,
    };
    await this.invoiceRepository.save({ id, ...updateData });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.invoiceRepository.delete(id);
    return { success: true };
  }

  async sendReminder(id: number) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['contract', 'contract.room', 'contract.tenant'],
    });

    if (!invoice) throw new Error('Không tìm thấy hóa đơn');
    if (invoice.status === 'paid') throw new Error('Hóa đơn này đã được thanh toán');

    await this.mailService.sendPaymentReminder(invoice);
    return { success: true, message: 'Đã gửi email nhắc nợ thành công' };
  }
}
