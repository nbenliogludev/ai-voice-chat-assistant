export type AiProviderName = 'groq' | 'gemini';

export type AiProvider = {
  generateReply(message: string): Promise<string>;
};

export const AI_PROVIDER_NAMES: AiProviderName[] = ['groq', 'gemini'];

export const isAiProviderName = (value: string): value is AiProviderName =>
  AI_PROVIDER_NAMES.includes(value as AiProviderName);
