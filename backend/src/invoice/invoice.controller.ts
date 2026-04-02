import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('invoice')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Roles('tenant', 'admin')
  @Get('my-invoices')
  findMy(@Request() req) {
    return this.invoiceService.findAllByTenant(req.user.id);
  }

  @Get()
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.invoiceService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.invoiceService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }

  @Post(':id/send-reminder')
  sendReminder(@Param('id') id: string) {
    return this.invoiceService.sendReminder(+id);
  }
}
