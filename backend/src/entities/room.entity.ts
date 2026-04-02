import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { Asset } from './asset.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 1 })
  floor: number;

  @Column()
  price: number;

  @Column({ default: 'available' })
  status: string; // available, rented, maintenance

  @OneToMany(() => Contract, contract => contract.room)
  contracts: Contract[];

  @OneToMany(() => Asset, asset => asset.room)
  assets: Asset[];
}
