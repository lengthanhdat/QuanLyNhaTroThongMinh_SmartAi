import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, contract => contract.invoices)
  contract: Contract;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column({ default: 'monthly' })
  type: string; // monthly, initial (Deposit + Rent), other

  @Column({ default: 0 })
  depositAmount: number; // Specific for initial payment type

  @Column({ default: 0 })
  rentPrice: number;

  @Column({ default: 0 })
  electricityAmount: number;

  @Column({ default: 0 })
  electricityKwh: number;

  @Column({ default: 0 })
  waterAmount: number;

  @Column({ default: 0 })
  trashAmount: number;

  @Column({ default: 0 })
  otherAmount: number;

  @Column()
  totalAmount: number;

  @Column({ default: 'unpaid' })
  status: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @OneToMany(() => Transaction, transaction => transaction.invoice)
  transactions: Transaction[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
