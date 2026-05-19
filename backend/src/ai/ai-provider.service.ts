import { HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../gemini/gemini.service';
import { GroqService } from '../groq/groq.service';
import { AiProviderName } from './ai-provider.types';

const DEFAULT_AI_PROVIDER: AiProviderName = 'groq';
const AI_PROVIDERS: AiProviderName[] = ['groq', 'gemini'];

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly groqService: GroqService
  ) {}

  async generateReply(message: string): Promise<string> {
    const provider = this.getConfiguredProvider();

    this.logger.log(`Using AI provider: ${provider}`);

    if (provider === 'gemini') {
      return this.geminiService.generateReply(message);
    }

    return this.groqService.generateReply(message);
  }

  private getConfiguredProvider(): AiProviderName {
    const configuredProvider = this.configService.get<string>('AI_PROVIDER')?.trim().toLowerCase();

    if (!configuredProvider) {
      return DEFAULT_AI_PROVIDER;
    }

    if (AI_PROVIDERS.includes(configuredProvider as AiProviderName)) {
      return configuredProvider as AiProviderName;
    }

    this.logger.error(`Unsupported AI_PROVIDER configured: ${configuredProvider}`);

    throw new InternalServerErrorException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Unsupported AI_PROVIDER "${configuredProvider}". Allowed values: groq, gemini.`,
      error: 'Unsupported AI_PROVIDER configured.'
    });
  }
}
