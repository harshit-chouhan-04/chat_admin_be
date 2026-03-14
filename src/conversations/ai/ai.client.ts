// src/conversations/ai.client.ts
export function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Make sure it is defined in your environment or .env file.',
    );
  }

  return {
    apiKey,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    model:
      process.env.OPENROUTER_MODEL ??
      process.env.AI_MODEL ??
      'deepseek/deepseek-chat-v3-0324',
    httpReferer: process.env.OPENROUTER_HTTP_REFERER,
    appName: process.env.OPENROUTER_APP_NAME ?? 'chat-be',
  };
}
