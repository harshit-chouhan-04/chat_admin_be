type Usage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

const ESTIMATED_CHARS_PER_TOKEN = 4;
const DEFAULT_INPUT_COST_PER_MILLION_TOKENS = 0.2;
const DEFAULT_OUTPUT_COST_PER_MILLION_TOKENS = 0.77;

function parsePositiveNumber(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function roundCost(value: number): number {
  return Number(value.toFixed(12));
}

function normalizePositiveTokenCount(value: number | undefined): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const numeric = Number(value);
  if (numeric <= 0) {
    return null;
  }

  return Math.floor(numeric);
}

function getInputCostPerMillionTokens(): number {
  return parsePositiveNumber(
    process.env.OPENROUTER_INPUT_COST_PER_MILLION_TOKENS,
    DEFAULT_INPUT_COST_PER_MILLION_TOKENS,
  );
}

function getOutputCostPerMillionTokens(): number {
  return parsePositiveNumber(
    process.env.OPENROUTER_OUTPUT_COST_PER_MILLION_TOKENS,
    DEFAULT_OUTPUT_COST_PER_MILLION_TOKENS,
  );
}

export function estimateTokenCountFromText(text: string): number {
  const normalized = text?.trim() ?? '';
  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / ESTIMATED_CHARS_PER_TOKEN));
}

export function calculateUserMessageCost(content: string): {
  tokenCount: number;
  cost: number;
} {
  const tokenCount = estimateTokenCountFromText(content);
  const inputCostPerToken = getInputCostPerMillionTokens() / 1_000_000;
  const cost = tokenCount * inputCostPerToken;

  return {
    tokenCount,
    cost: roundCost(cost),
  };
}

export function calculateAssistantMessageCost(params: {
  content: string;
  usage?: Usage;
}): {
  tokenCount: number;
  cost: number;
} {
  const usage = params.usage;
  const estimatedOutputTokens = estimateTokenCountFromText(params.content);
  const normalizedInputTokens = normalizePositiveTokenCount(usage?.inputTokens);
  const normalizedOutputTokens = normalizePositiveTokenCount(usage?.outputTokens);
  const normalizedTotalTokens = normalizePositiveTokenCount(usage?.totalTokens);

  const inputTokens = normalizedInputTokens ?? 0;
  const outputTokens = normalizedOutputTokens ?? estimatedOutputTokens;
  const tokenCount = normalizedTotalTokens ?? inputTokens + outputTokens;

  const inputCostPerToken = getInputCostPerMillionTokens() / 1_000_000;
  const outputCostPerToken = getOutputCostPerMillionTokens() / 1_000_000;
  const cost =
    Math.max(0, inputTokens) * inputCostPerToken +
    Math.max(0, outputTokens) * outputCostPerToken;

  return {
    tokenCount,
    cost: roundCost(cost),
  };
}

export function formatCostForDisplay(cost: number): string {
  if (!Number.isFinite(cost) || cost <= 0) {
    return '0';
  }

  return cost.toFixed(12).replace(/\.?0+$/, '') || '0';
}
