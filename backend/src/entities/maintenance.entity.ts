import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Room } from './room.entity';
import { Tenant } from './tenant.entity';

@Entity()
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string; // Điện, Nước, Wifi, Khác

  @Column({ default: 'Bình thường' })
  priority: string; // Bình thường, Gấp

  @Column({ default: 'pending' })
  status: string; // pending, processing, completed, cancelled

  @Column({ type: 'text', nullable: true })
  image: string;

  @ManyToOne(() => Room, { nullable: true })
  room: Room;

  @ManyToOne(() => Tenant, { nullable: true })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
