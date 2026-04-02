import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SettingModule } from '../setting/setting.module';

@Module({
  imports: [SettingModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
