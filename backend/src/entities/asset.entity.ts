import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  category: string; // Electronics, Furniture, Appliances, Other

  @ManyToOne(() => Room, { nullable: true })
  room: Room;

  @Column({ default: 'good' })
  status: string; // good, maintenance, broken

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ nullable: true })
  lastMaintenanceNote: string;

  @Column({ nullable: true })
  image: string; // URL or File Path

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
