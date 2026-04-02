import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  cccd: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @OneToMany(() => Contract, contract => contract.tenant)
  contracts: Contract[];

  @Column({ default: 'tenant' })
  role: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true })
  resetOtp: string;

  @Column({ type: 'timestamp', nullable: true })
  resetOtpExpiry: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
