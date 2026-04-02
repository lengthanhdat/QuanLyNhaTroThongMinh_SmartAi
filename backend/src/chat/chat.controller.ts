import { Controller, Get, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('admin')
  async getAdmin() {
    const admin = await this.chatService.findAdmin();
    return { id: admin?.id, name: admin?.fullName };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Patch('read/:senderId')
  async markAsRead(@Param('senderId') senderId: string, @Req() req: any) {
    return this.chatService.markAsRead(req.user.id, +senderId);
  }

  @Get('history/:otherUserId')
  async getHistory(@Param('otherUserId') otherUserId: string, @Req() req: any) {
    return this.chatService.getHistory(req.user.id, +otherUserId);
  }

  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.id);
  }
}
