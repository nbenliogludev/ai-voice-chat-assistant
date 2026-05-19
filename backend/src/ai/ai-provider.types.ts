export type AiProviderName = 'groq' | 'gemini';

export type AiProvider = {
  generateReply(message: string): Promise<string>;
};
