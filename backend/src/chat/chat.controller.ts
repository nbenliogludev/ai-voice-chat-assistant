import {
  BadRequestException,
  Controller,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  Post,
  Body
} from '@nestjs/common';
import { AiProviderService } from '../ai/ai-provider.service';

type ChatRequestBody = {
  message?: unknown;
};

type ChatResponse = {
  reply: string;
};

@Controller('api/chat')
export class ChatController {
  constructor(private readonly aiProviderService: AiProviderService) {}

  @Post()
  async createReply(@Body() body: ChatRequestBody): Promise<ChatResponse> {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Message is required.',
        error: 'Message is required.'
      });
    }

    try {
      const reply = await this.aiProviderService.generateReply(message);

      return { reply };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unexpected server error.',
        error: 'Unexpected server error.'
      });
    }
  }
}
