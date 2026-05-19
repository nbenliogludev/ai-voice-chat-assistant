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
import { AiProviderName, isAiProviderName } from '../ai/ai-provider.types';

type ChatRequestBody = {
  message?: unknown;
  provider?: unknown;
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
    const provider = this.getRequestProvider(body?.provider);

    if (!message) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Message is required.',
        error: 'Message is required.'
      });
    }

    try {
      const reply = await this.aiProviderService.generateReply(message, provider);

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

  private getRequestProvider(provider: unknown): AiProviderName | undefined {
    if (provider === undefined || provider === null || provider === '') {
      return undefined;
    }

    if (typeof provider !== 'string') {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'AI provider must be either groq or gemini.',
        error: 'Invalid AI provider.'
      });
    }

    const normalizedProvider = provider.trim().toLowerCase();

    if (isAiProviderName(normalizedProvider)) {
      return normalizedProvider;
    }

    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'AI provider must be either groq or gemini.',
      error: 'Invalid AI provider.'
    });
  }
}
