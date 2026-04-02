import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'all' })
  recipientType: string; // all, floor, room

  @Column({ nullable: true })
  targetId: string; // Floor number or Room ID/Name

  @Column({ default: 'normal' })
  priority: string; // normal, urgent

  @Column({ default: 'sent' })
  status: string; // draft, sent

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
