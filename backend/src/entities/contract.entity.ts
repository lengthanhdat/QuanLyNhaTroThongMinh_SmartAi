import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Room } from './room.entity';
import { Tenant } from './tenant.entity';
import { Invoice } from './invoice.entity';

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.contracts)
  room: Room;

  @ManyToOne(() => Tenant, (tenant) => tenant.contracts)
  tenant: Tenant;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column()
  price: number;

  @Column({ default: 0 })
  deposit: number;

  @Column({ default: false })
  depositPaid: boolean;

  @Column({ default: 'pending' })
  status: string; // active, ended, pending

  // ── Thông tin Bên A (Landlord) ──────────────────────────────────
  @Column({ nullable: true })
  landlordName: string;

  @Column({ nullable: true })
  landlordDob: string;

  @Column({ nullable: true })
  landlordCccd: string;

  @Column({ nullable: true })
  landlordPhone: string;

  @Column({ nullable: true })
  landlordAddress: string;

  // ── Thông tin Bên B (Tenant) ──────────────────────────────────
  @Column({ nullable: true })
  tenantName: string;

  @Column({ nullable: true })
  tenantDob: string;

  @Column({ nullable: true })
  tenantAddress: string;

  @Column({ nullable: true })
  tenantCccd: string;

  @Column({ nullable: true })
  tenantPhone: string;

  // ── Địa chỉ nhà trọ ────────────────────────────────────────────
  @Column({ nullable: true })
  propertyAddress: string;

  // ── Phí dịch vụ ────────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  electricityRate: number;

  @Column({ type: 'float', nullable: true })
  waterRate: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @OneToMany(() => Invoice, (invoice) => invoice.contract)
  invoices: Invoice[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
