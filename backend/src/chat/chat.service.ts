import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async findAdmin() {
    return this.tenantRepository.findOne({ where: { role: 'admin' } });
  }

  async saveMessage(payload: any) {
    const chat = this.chatRepository.create({
      sender: { id: payload.senderId },
      receiver: { id: payload.receiverId },
      content: payload.content,
      image: payload.image,
    });
    const savedChat = await this.chatRepository.save(chat);
    return this.chatRepository.findOne({
      where: { id: savedChat.id },
      relations: ['sender', 'receiver'],
    });
  }

  async getHistory(userId1: number, userId2: number) {
    return this.chatRepository.find({
      where: [
        { sender: { id: userId1 }, receiver: { id: userId2 } },
        { sender: { id: userId2 }, receiver: { id: userId1 } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }

  async getUnreadCount(userId: number) {
    return this.chatRepository.count({
      where: { receiver: { id: userId }, isRead: false }
    });
  }

  async markAsRead(userId: number, senderId: number) {
    return this.chatRepository.update(
      { receiver: { id: userId }, sender: { id: senderId }, isRead: false },
      { isRead: true }
    );
  }

  async getConversations(userId: number) {
    // Lấy danh sách những người đã nhắn tin với userId
    const messages = await this.chatRepository.find({
      where: [
        { sender: { id: userId } },
        { receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
    });

    const conversationsMap = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender.id === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      
      // Nếu là người nhận và tin nhắn chưa đọc, tăng count cho conv này
      if (msg.receiver.id === userId && !msg.isRead) {
        conversationsMap.get(otherUser.id).unreadCount += 1;
      }
    });

    return Array.from(conversationsMap.values());
  }
}
