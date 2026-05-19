import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AI_RESPONSE_STYLE_PROMPT } from '../ai/ai-response-guidelines';

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const MAX_COMPLETION_TOKENS = 512;

type ProviderErrorDetails = {
  message: string;
  name?: string;
  stack?: string;
  status?: number;
};

const getProviderErrorDetails = (error: unknown): ProviderErrorDetails => {
  if (error instanceof Error) {
    const maybeApiError = error as Error & { status?: unknown };

    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      status: typeof maybeApiError.status === 'number' ? maybeApiError.status : undefined
    };
  }

  return {
    message: String(error)
  };
};

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateReply(message: string): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const model = this.configService.get<string>('GROQ_MODEL')?.trim() || DEFAULT_GROQ_MODEL;

    if (!apiKey) {
      this.logger.error('GROQ_API_KEY is missing. Groq requests cannot be processed.');

      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'GROQ_API_KEY is not configured.',
        error: 'GROQ_API_KEY is not configured.'
      });
    }

    try {
      this.logger.log(`Sending Groq request. model=${model} messageLength=${message.length}`);

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: AI_RESPONSE_STYLE_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        model,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        temperature: 0.7
      });
      const reply = completion.choices[0]?.message?.content?.trim();

      if (!reply) {
        this.logger.error(`Groq returned an empty response. model=${model}`);

        throw new BadGatewayException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Groq returned an empty response.',
          error: 'Groq returned an empty response.'
        });
      }

      this.logger.log(`Groq reply generated. model=${model} replyLength=${reply.length}`);

      return reply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const details = getProviderErrorDetails(error);
      const statusPart = details.status ? ` status=${details.status}` : '';
      const namePart = details.name ? ` name=${details.name}` : '';

      this.logger.error(
        `Groq API request failed.${statusPart}${namePart} message=${details.message} model=${model}`,
        details.stack
      );

      if (details.status === HttpStatus.TOO_MANY_REQUESTS) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Groq rate limit exceeded. Please try again later.',
            error: 'Groq rate limit exceeded.'
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Groq API request failed. Check backend logs for details.',
        error: 'Groq API request failed.'
      });
    }
  }
}
