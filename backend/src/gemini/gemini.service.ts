import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

type GeminiErrorDetails = {
  message: string;
  name?: string;
  stack?: string;
  status?: number;
};

const getGeminiErrorDetails = (error: unknown): GeminiErrorDetails => {
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
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateReply(message: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing. Gemini requests cannot be processed.');

      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'GEMINI_API_KEY is not configured.',
        error: 'GEMINI_API_KEY is not configured.'
      });
    }

    try {
      this.logger.log(`Sending Gemini request. model=${model} messageLength=${message.length}`);

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: message
      });
      const reply = response.text?.trim();

      if (!reply) {
        this.logger.error(`Gemini returned an empty response. model=${model}`);

        throw new BadGatewayException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Gemini returned an empty response.',
          error: 'Gemini returned an empty response.'
        });
      }

      this.logger.log(`Gemini reply generated. model=${model} replyLength=${reply.length}`);

      return reply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const details = getGeminiErrorDetails(error);
      const statusPart = details.status ? ` status=${details.status}` : '';
      const namePart = details.name ? ` name=${details.name}` : '';

      this.logger.error(
        `Gemini API request failed.${statusPart}${namePart} message=${details.message} model=${model}`,
        details.stack
      );

      if (details.status === HttpStatus.TOO_MANY_REQUESTS) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Gemini quota or rate limit exceeded. Please try again later.',
            error: 'Gemini quota or rate limit exceeded.'
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Gemini API request failed. Check backend logs for details.',
        error: 'Gemini API request failed.'
      });
    }
  }
}
