import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { GroqModule } from '../groq/groq.module';
import { AiProviderService } from './ai-provider.service';

@Module({
  imports: [GeminiModule, GroqModule],
  providers: [AiProviderService],
  exports: [AiProviderService]
})
export class AiModule {}
