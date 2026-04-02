import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: any): Promise<Tenant> {
    return this.tenantRepository.save(createTenantDto);
  }

  async findAll() {
    const tenants = await this.tenantRepository.find({ 
      relations: ['contracts', 'contracts.room', 'contracts.invoices'] 
    });

    // Calculate dynamic debt for each tenant
    return tenants.map(t => {
      const debt = t.contracts.reduce((acc, c) => {
        const unpaid = c.invoices
          .filter(i => i.status === 'unpaid')
          .reduce((sum, inv) => sum + inv.totalAmount, 0);
        return acc + unpaid;
      }, 0);

      // Extract active room name
      const activeContract = t.contracts.find(c => c.status === 'active');
      
      return {
        ...t,
        debt,
        roomName: activeContract?.room?.name || 'Chưa gán',
      };
    });
  }

  findByName(name: string) {
    return this.tenantRepository.findOne({ where: { fullName: name } });
  }

  findByEmail(email: string) {
    return this.tenantRepository.findOne({ 
      where: { email },
      relations: ['contracts', 'contracts.room', 'contracts.invoices']
    });
  }

  findByEmailWithPassword(email: string) {
    return this.tenantRepository.createQueryBuilder('tenant')
      .addSelect('tenant.password')
      .where('tenant.email = :email', { email })
      .getOne();
  }

  findOne(id: number) {
    return this.tenantRepository.findOne({ where: { id }, relations: ['contracts'] });
  }

  async getVerificationCode(id: number) {
    const tenant = await this.tenantRepository.createQueryBuilder('tenant')
      .addSelect('tenant.verificationCode')
      .where('tenant.id = :id', { id })
      .getOne();
    return tenant?.verificationCode;
  }

  async update(id: number, updateTenantDto: any) {
    await this.tenantRepository.update(id, updateTenantDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.tenantRepository.delete(id);
  }
}
