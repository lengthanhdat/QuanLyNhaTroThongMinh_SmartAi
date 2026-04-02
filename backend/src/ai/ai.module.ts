import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RoomModule } from '../room/room.module';
import { TenantModule } from '../tenant/tenant.module';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [RoomModule, TenantModule, ContractModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
