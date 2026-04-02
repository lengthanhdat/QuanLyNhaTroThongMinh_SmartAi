import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

import { NotificationGateway } from './notification.gateway';

import { NotificationRead } from '../entities/notification-read.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationRead)
    private readRepository: Repository<NotificationRead>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async findAll(userId?: number) {
    const notifications = await this.notificationRepository.find({
      order: { createdAt: 'DESC' }
    });

    if (!userId) return notifications;

    // Lấy danh sách ID các thông báo đã đọc bởi user này
    const readRecords = await this.readRepository.find({
      where: { tenant: { id: userId } },
      relations: ['notification']
    });

    const readIds = new Set(readRecords.map(r => r.notification.id));

    return notifications.map(n => ({
      ...n,
      read: readIds.has(n.id)
    }));
  }

  async markAsRead(notificationId: number, userId: number) {
    const existing = await this.readRepository.findOne({
      where: { 
        notification: { id: notificationId },
        tenant: { id: userId }
      }
    });

    if (!existing) {
      const read = this.readRepository.create({
        notification: { id: notificationId },
        tenant: { id: userId }
      });
      return this.readRepository.save(read);
    }
    return existing;
  }

  async markAllAsRead(userId: number) {
    const notifications = await this.notificationRepository.find({ select: ['id'] });
    const tasks = notifications.map(n => this.markAsRead(n.id, userId));
    return Promise.all(tasks);
  }

  async findOne(id: number) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async create(data: any) {
    const notification = await this.notificationRepository.save(data);
    this.notificationGateway.sendNotification(notification);
    return notification;
  }

  async update(id: number, data: any) {
    await this.notificationRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.notificationRepository.delete(id);
  }
}
