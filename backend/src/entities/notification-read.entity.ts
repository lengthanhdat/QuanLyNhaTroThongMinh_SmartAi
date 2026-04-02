import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Notification } from './notification.entity';

@Entity()
@Unique(['tenant', 'notification'])
export class NotificationRead {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @ManyToOne(() => Notification)
  notification: Notification;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  readAt: Date;
}
