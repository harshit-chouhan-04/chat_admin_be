export type AiStreamOptions = {
  /** Optional model override (provider-specific). */
  model?: string;
};

export interface AiStreamer {
  streamText(prompt: string, options?: AiStreamOptions): AsyncIterable<string>;
}

/** Nest injection token for the active AI streamer implementation. */
export const AI_STREAMER = 'AI_STREAMER';
