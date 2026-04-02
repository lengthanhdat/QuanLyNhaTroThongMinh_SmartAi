import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: { id: number; role: string };
}

@Controller('contract')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Roles('tenant', 'admin')
  @Get('my-contracts')
  findMy(@Request() req: RequestWithUser) {
    return this.contractService.findAllByTenant(req.user.id);
  }

  @Post()
  create(@Body() createContractDto: any) {
    return this.contractService.create(createContractDto);
  }

  @Get()
  findAll() {
    return this.contractService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(+id);
  }

  @Roles('admin', 'tenant')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractDto: any) {
    return this.contractService.update(+id, updateContractDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractService.remove(+id);
  }
}
