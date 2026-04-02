import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  async findAll() {
    return this.assetRepository.find({ relations: ['room'] });
  }

  async findByRoom(roomId: number) {
    return this.assetRepository.find({
      where: { room: { id: roomId } },
      relations: ['room'],
    });
  }

  async findOne(id: number) {
    return this.assetRepository.findOne({ where: { id }, relations: ['room'] });
  }

  async create(data: any) {
    // Bulk create if roomIds is provided
    if (data.roomIds && Array.isArray(data.roomIds) && data.roomIds.length > 0) {
      const { roomIds, ...rest } = data;
      const creations = roomIds.map(roomId => {
        return this.assetRepository.save({
          ...rest,
          room: { id: roomId }
        });
      });
      return Promise.all(creations);
    }
    
    // Normal create
    return this.assetRepository.save(data);
  }

  async update(id: number, data: any) {
    return this.assetRepository.save({ id, ...data });
  }

  async remove(id: number) {
    return this.assetRepository.delete(id);
  }

  async getStats() {
    const total = await this.assetRepository.count();
    const good = await this.assetRepository.count({ where: { status: 'good' } });
    const maintenance = await this.assetRepository.count({ where: { status: 'maintenance' } });
    const broken = await this.assetRepository.count({ where: { status: 'broken' } });

    return {
      total,
      good,
      maintenance,
      broken
    };
  }
}
