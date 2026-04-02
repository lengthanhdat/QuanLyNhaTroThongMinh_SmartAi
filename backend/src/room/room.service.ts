import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  create(createRoomDto: any): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto as object);
    return this.roomRepository.save(room);
  }

  findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      relations: ['contracts', 'contracts.tenant'],
    });
  }

  findByName(name: string): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { name },
      relations: ['contracts', 'contracts.tenant'],
    });
  }

  findOne(id: number): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { id },
      relations: ['contracts', 'contracts.tenant'],
    });
  }

  async update(id: number, updateRoomDto: any): Promise<Room | null> {
    await this.roomRepository.update(id, updateRoomDto as object);
    return this.findOne(id);
  }

  remove(id: number): Promise<any> {
    return this.roomRepository.delete(id);
  }
}
