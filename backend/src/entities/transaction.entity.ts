import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, invoice => invoice.transactions)
  invoice: Invoice;

  @Column()
  amount: number;

  @Column()
  paymentMethod: string; // vnpay, cash, transfer

  @Column({ nullable: true })
  vnpayTxnId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;
}
