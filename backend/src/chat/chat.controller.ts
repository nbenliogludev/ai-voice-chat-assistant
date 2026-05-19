import {
  BadRequestException,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  Body
} from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

type ChatRequestBody = {
  message?: unknown;
};

type ChatResponse = {
  reply: string;
};

@Controller('api/chat')
export class ChatController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post()
  async createReply(@Body() body: ChatRequestBody): Promise<ChatResponse> {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      throw new BadRequestException('Message is required.');
    }

    try {
      const reply = await this.geminiService.generateReply(message);

      return { reply };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Unexpected server error.');
    }
  }
}
