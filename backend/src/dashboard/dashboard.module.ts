import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Tenant } from '../entities/tenant.entity';
import { Room } from '../entities/room.entity';
import { Invoice } from '../entities/invoice.entity';
import { Contract } from '../entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Room, Invoice, Contract])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
