import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('activities')
  getActivities() {
    return this.dashboardService.getActivities();
  }

  @Get('todos')
  getTodos() {
    return this.dashboardService.getTodos();
  }

  @Get('debtors')
  getDebtors() {
    return this.dashboardService.getDebtors();
  }
}
