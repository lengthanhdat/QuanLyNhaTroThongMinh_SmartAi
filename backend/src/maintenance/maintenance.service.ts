import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../entities/maintenance.entity';
import { Contract } from '../entities/contract.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async create(createDto: any, user: any) {
    // Tìm hợp đồng đang hiệu lực để lấy roomId
    const contract = await this.contractRepository.findOne({
      where: { 
        tenant: { id: user.id },
        status: 'active'
      },
      relations: ['room'],
    });

    const maintenance = this.maintenanceRepository.create({
      ...createDto,
      tenant: { id: user.id },
      room: contract?.room ? { id: contract.room.id } : null,
    });

    return this.maintenanceRepository.save(maintenance);
  }

  async findAll() {
    return this.maintenanceRepository.find({
      relations: ['room', 'tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTenant(userId: number) {
    return this.maintenanceRepository.find({
      where: { tenant: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string) {
    const maintenance = await this.maintenanceRepository.findOne({ where: { id } });
    if (!maintenance) throw new NotFoundException('Yêu cầu không tồn tại');

    maintenance.status = status;
    return this.maintenanceRepository.save(maintenance);
  }

  async findOne(id: number) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['room', 'tenant'],
    });
    if (!maintenance) throw new NotFoundException('Yêu cầu không tồn tại');
    return maintenance;
  }
}
