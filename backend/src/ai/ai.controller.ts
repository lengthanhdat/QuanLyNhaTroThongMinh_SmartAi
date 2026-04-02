import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('command')
  async handleCommand(@Body() body: { command: string }) {
    if (!body || !body.command) {
      return { success: false, message: 'Vui lòng cung cấp câu lệnh.' };
    }
    return this.aiService.processCommand(body.command);
  }
}
