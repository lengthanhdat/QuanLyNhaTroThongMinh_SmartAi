import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    const count = await this.settingRepository.count();
    if (count === 0) {
      const defaults = [
        { key: 'buildingName', value: 'SmartTrọ Luxury' },
        { key: 'electricityPrice', value: '3500' },
        { key: 'waterPrice', value: '20000' },
        { key: 'internetPrice', value: '100000' },
        { key: 'trashPrice', value: '50000' },
        { key: 'phone', value: '0987 654 321' },
        { key: 'address', value: 'Số 123 Đường Hạnh Phúc, Quận 1, TP. Hồ Chí Minh' },
        { key: 'autoSendEmail', value: 'true' },
        { key: 'enableAI', value: 'true' },
        { key: 'zaloNotification', value: 'true' },
      ];
      await this.settingRepository.save(defaults);
    }
  }

  async getAll() {
    const list = await this.settingRepository.find();
    return list.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }

  async updateAll(data: Record<string, any>) {
    const updates = Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    return this.settingRepository.save(updates);
  }
}
