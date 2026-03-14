import { Injectable } from '@nestjs/common';
import { AiStreamOptions, AiStreamer } from './ai-streamer';
import { OpenRouterAiStreamerService } from './openrouter-ai-streamer.service';

@Injectable()
export class GeminiAiStreamerService implements AiStreamer {
  constructor(private readonly openRouter: OpenRouterAiStreamerService) {}

  async *streamText(
    prompt: string,
    options?: AiStreamOptions,
  ): AsyncIterable<string> {
    // Deprecated adapter kept only for compatibility; OpenRouter is the active provider.
    for await (const token of this.openRouter.streamText(prompt, options)) {
      yield token;
    }
  }
}
