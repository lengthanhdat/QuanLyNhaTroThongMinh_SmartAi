import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async getSettings() {
    return this.settingService.getAll();
  }

  @Patch()
  async updateSettings(@Body() data: any) {
    return this.settingService.updateAll(data);
  }
}
