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

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

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

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing. Gemini requests cannot be processed.');

      throw new InternalServerErrorException('GEMINI_API_KEY is not configured.');
    }

    try {
      this.logger.log(`Sending Gemini request. model=${GEMINI_MODEL} messageLength=${message.length}`);

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: message
      });
      const reply = response.text?.trim();

      if (!reply) {
        this.logger.error(`Gemini returned an empty response. model=${GEMINI_MODEL}`);

        throw new BadGatewayException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Gemini returned an empty response.',
          error: 'Gemini returned an empty response.'
        });
      }

      this.logger.log(`Gemini reply generated. model=${GEMINI_MODEL} replyLength=${reply.length}`);

      return reply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const details = getGeminiErrorDetails(error);
      const statusPart = details.status ? ` status=${details.status}` : '';
      const namePart = details.name ? ` name=${details.name}` : '';

      this.logger.error(
        `Gemini API request failed.${statusPart}${namePart} message=${details.message} model=${GEMINI_MODEL}`,
        details.stack
      );

      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Gemini API request failed. Check backend logs for details.',
        error: 'Gemini API request failed.'
      });
    }
  }
}
