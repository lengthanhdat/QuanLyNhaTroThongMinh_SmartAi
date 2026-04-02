import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Room } from './entities/room.entity';
import { Tenant } from './entities/tenant.entity';
import { Contract } from './entities/contract.entity';
import { Invoice } from './entities/invoice.entity';
import { Transaction } from './entities/transaction.entity';
import { Asset } from './entities/asset.entity';
import { Notification as NotificationEntity } from './entities/notification.entity';
import { Setting } from './entities/setting.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Chat } from './entities/chat.entity';
import { NotificationRead } from './entities/notification-read.entity';

import { RoomModule } from './room/room.module';
import { TenantModule } from './tenant/tenant.module';
import { ContractModule } from './contract/contract.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TransactionModule } from './transaction/transaction.module';
import { AssetModule } from './asset/asset.module';
import { NotificationModule } from './notification/notification.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { VnpayModule } from './vnpay/vnpay.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingModule } from './setting/setting.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Room, Tenant, Contract, Invoice, Transaction, Setting, Asset, NotificationEntity, Maintenance, Chat, NotificationRead],
        synchronize: true,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    RoomModule,
    TenantModule,
    ContractModule,
    InvoiceModule,
    TransactionModule,
    AssetModule,
    NotificationModule,
    MaintenanceModule,
    ChatModule,
    AiModule,
    VnpayModule,
    AuthModule,
    DashboardModule,
    SettingModule,
    MailModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
        defaults: {
          from: `"SmartTrọAI" <${process.env.MAIL_USER}>`,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
