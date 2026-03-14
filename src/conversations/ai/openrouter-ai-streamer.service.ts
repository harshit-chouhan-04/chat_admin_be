import { Injectable } from '@nestjs/common';
import { getOpenRouterConfig } from './ai.client';
import { AiStreamOptions, AiStreamer } from './ai-streamer';

@Injectable()
export class OpenRouterAiStreamerService implements AiStreamer {
  async *streamText(
    prompt: string,
    options?: AiStreamOptions,
  ): AsyncIterable<string> {
    const config = getOpenRouterConfig();
    const modelName = options?.model ?? config.model;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (config.httpReferer) {
      headers['HTTP-Referer'] = config.httpReferer;
    }
    if (config.appName) {
      headers['X-Title'] = config.appName;
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `OpenRouter request failed (${response.status}): ${errorText}`,
      );
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) yield token;
          } catch {
            // Ignore malformed chunks and continue streaming.
          }
        }
      }
    }
  }
}
