import { BadGatewayException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

@Injectable()
export class GeminiService {
  constructor(private readonly configService: ConfigService) {}

  async generateReply(message: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured.');
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: message
      });
      const reply = response.text?.trim();

      if (!reply) {
        throw new BadGatewayException('Gemini returned an empty response.');
      }

      return reply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadGatewayException('Gemini API request failed.');
    }
  }
}
