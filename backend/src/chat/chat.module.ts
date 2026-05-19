import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [GeminiModule],
  controllers: [ChatController]
})
export class ChatModule {}
