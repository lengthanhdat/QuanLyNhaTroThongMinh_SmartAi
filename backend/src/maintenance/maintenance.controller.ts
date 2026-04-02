import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Roles('tenant')
  @Post()
  create(@Body() createDto: any, @Req() req: any) {
    return this.maintenanceService.create(createDto, req.user);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Roles('tenant')
  @Get('my-requests')
  findByTenant(@Req() req: any) {
    return this.maintenanceService.findByTenant(req.user.id);
  }

  @Roles('admin')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.maintenanceService.updateStatus(+id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(+id);
  }
}
