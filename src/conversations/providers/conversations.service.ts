import {
  BadRequestException,
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';
import { Message } from 'src/messages/entities/message.entites';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';
import { Conversation } from '../entities/conversation.entity';
import { Character } from 'src/characters/entities/character.entity';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';
import {
  IntimacyStage,
  stagePromptGuidance,
  stageSafeFallback,
  violatesStage,
} from './intimacy-progress.util';
import {
  calculateAssistantMessageCost,
  formatCostForDisplay,
} from 'src/messages/providers/message-cost.util';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ProviderResult = {
  text: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

const PROVIDER_TIMEOUT_MS = 20_000;
const PROVIDER_MAX_ATTEMPTS = 1;
const MAX_CONTEXT_HISTORY_MESSAGES = 40;
const HISTORY_SUMMARY_TRIGGER_MESSAGES = 24;
const KEEP_RECENT_RAW_MESSAGES = 12;
const MAX_SUMMARY_CHARS = 2000;
type PersonaGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,

    @InjectModel(Message.name)
    private messageModel: Model<Message>,

    @InjectModel(Character.name)
    private characterModel: Model<Character>,
  ) {}

  async create(data: {
    title: string;
    user?: string;
    userId?: string;
    character?: string;
    characterId?: string;
    personaGender?: PersonaGender;
    personaAge?: number;
    personaName?: string;
  }) {
    const user = data.user ?? data.userId;
    const character = data.character ?? data.characterId;

    if (!user) {
      throw new BadRequestException('user is required');
    }
    if (!character) {
      throw new BadRequestException('character is required');
    }

    const existing = await this.conversationModel.findOne({
      user,
      character,
      isArchived: false,
    });
    if (existing) {
      const normalizedPersona = this.normalizePersona({
        gender: data.personaGender,
        age: data.personaAge,
        name: data.personaName,
      });
      if (
        normalizedPersona.gender ||
        normalizedPersona.age ||
        normalizedPersona.name
      ) {
        existing.personaName = normalizedPersona.name;
        existing.personaGender = normalizedPersona.gender;
        existing.personaAge = normalizedPersona.age;
        existing.personaUpdatedAt = new Date();
        await existing.save();
      }
      return existing;
    }

    const normalizedPersona = this.normalizePersona({
      gender: data.personaGender,
      age: data.personaAge,
      name: data.personaName,
    });

    return this.conversationModel.create({
      title: data.title,
      user,
      character,
      isArchived: false,
      messageCount: 0,
      userMessageCount: 0,
      intimacyScore: 0,
      intimacyStage: 'ICEBREAKER',
      personaName: normalizedPersona.name,
      personaGender: normalizedPersona.gender,
      personaAge: normalizedPersona.age,
      personaUpdatedAt:
        normalizedPersona.name ||
        normalizedPersona.gender ||
        normalizedPersona.age
          ? new Date()
          : undefined,
      totalTokenCount: 0,
      totalCost: 0,
      userMessageCostTotal: 0,
      assistantMessageCostTotal: 0,
    });
  }

  async updatePersona(
    conversationId: string,
    data: {
      personaName?: string;
      personaGender?: PersonaGender;
      personaAge?: number;
    },
  ) {
    const conversation = await this.getConversationOrThrow(conversationId);

    const normalizedPersona = this.normalizePersona({
      name: data.personaName,
      gender: data.personaGender,
      age: data.personaAge,
    });

    if (
      !normalizedPersona.name ||
      !normalizedPersona.gender ||
      !normalizedPersona.age
    ) {
      throw new BadRequestException(
        'personaName, personaGender and personaAge are required',
      );
    }

    conversation.personaName = normalizedPersona.name;
    conversation.personaGender = normalizedPersona.gender;
    conversation.personaAge = normalizedPersona.age;
    conversation.personaUpdatedAt = new Date();
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        personaName: conversation.personaName,
        personaGender: conversation.personaGender,
        personaAge: conversation.personaAge,
        personaUpdatedAt: conversation.personaUpdatedAt,
      },
    });

    return {
      conversationId,
      personaName: conversation.personaName,
      personaGender: conversation.personaGender,
      personaAge: conversation.personaAge,
      personaUpdatedAt: conversation.personaUpdatedAt,
    };
  }

  findAll(userId?: string) {
    const filter: Record<string, unknown> = { isArchived: false };
    if (userId) {
      filter.user = userId;
    }

    return this.conversationModel.find(filter).sort({ updatedAt: -1 });
  }

  async getMessages(conversationId: string) {
    await this.getConversationOrThrow(conversationId);
    return this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: 1 });
  }

  async getCharacters(userId?: string): Promise<
    {
      characterId: string;
      name: string;
      avatarUrl?: string;
      description?: string;
      isOnline: boolean;
      conversationId: string | null;
    }[]
  > {
    const characters = await this.characterModel
      .find({
        visibility: CHARACTER_VISIBILITY.PUBLIC,
        isActive: true,
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!userId) {
      return characters.map((c) => ({
        characterId: (c as any)._id.toString(),
        name: c.name,
        avatarUrl: c.avatarUrl,
        description: c.description,
        isOnline: true,
        conversationId: null,
      }));
    }

    const userConversations = (await this.conversationModel
      .find({ user: userId, isArchived: false })
      .sort({ updatedAt: -1 })
      .lean()) as Array<Conversation & { _id: { toString: () => string } }>;

    const latestConversationByCharacter = new Map<string, string>();
    for (const convo of userConversations) {
      const charId =
        (convo as any).character?.toString?.() ?? (convo as any).character;
      if (charId && !latestConversationByCharacter.has(charId)) {
        latestConversationByCharacter.set(charId, convo._id.toString());
      }
    }

    return characters.map((c) => {
      const charId = (c as any)._id.toString();
      return {
        characterId: charId,
        name: c.name,
        avatarUrl: c.avatarUrl,
        description: c.description,
        isOnline: true,
        conversationId: latestConversationByCharacter.get(charId) ?? null,
      };
    });
  }

  streamAiReply(conversationId: string): Observable<MessageEvent> {
    return new Observable((observer) => {
      (async () => {
        try {
          const conversation = await this.getConversationOrThrow(conversationId);

          const character = await this.characterModel.findById(
            (conversation as any).character,
          );
          if (!character) {
            throw new NotFoundException('Character not found');
          }

          const historyDocs = await this.messageModel
            .find({ conversation: conversationId })
            .sort({ createdAt: -1 })
            .limit(MAX_CONTEXT_HISTORY_MESSAGES);

          const intimacyScore = conversation.intimacyScore ?? 0;
          const userMessageCount = conversation.userMessageCount ?? 0;
          const intimacyStage =
            (conversation.intimacyStage as IntimacyStage | undefined) ??
            'ICEBREAKER';

          const history: ChatMessage[] = historyDocs.reverse().map((m) => ({
            role:
              m.senderType === SENDER_TYPE.USER
                ? ('user' as const)
                : ('assistant' as const),
            content: m.content,
          }));

          const latestUserMessageDoc = historyDocs.find(
            (m) => m.senderType === SENDER_TYPE.USER,
          ) as (Message & { sceneDetails?: string }) | undefined;
          const sceneDetails = latestUserMessageDoc?.sceneDetails?.trim() ?? '';

          const userMessage = [...history]
            .reverse()
            .find((item) => item.role === 'user')?.content;

          if (!userMessage) {
            throw new BadRequestException(
              'No user message found in conversation',
            );
          }

          const historyWithoutLatestUser = [...history];
          const latestUserIndex = historyWithoutLatestUser
            .map((item) => item.role)
            .lastIndexOf('user');
          if (latestUserIndex !== -1) {
            historyWithoutLatestUser.splice(latestUserIndex, 1);
          }

          const providerHistory = this.buildCondensedHistory(
            historyWithoutLatestUser,
          );
          const systemPrompt = this.buildSystemPrompt({
            character,
            sceneDetails,
            stage: intimacyStage,
            userMessageCount,
            intimacyScore,
            memorySummary: conversation.memorySummary?.trim() ?? '',
            personaName: conversation.personaName,
            personaGender: conversation.personaGender,
            personaAge: conversation.personaAge,
          });

          const providerResult = await this.callDeepseek(
            systemPrompt,
            providerHistory,
            userMessage,
          );

          this.logTokenUsage(providerResult.model, providerResult.usage);

          const resolvedReply = await this.resolveUsableReply({
            initialResult: providerResult,
            systemPrompt,
            history: providerHistory,
            message: userMessage,
            characterName: character.name,
          });
          const normalizedReply = resolvedReply.text;
          const reply = await this.ensureStageCompliance({
            reply: normalizedReply,
            stage: intimacyStage,
            characterName: character.name,
          });

          for (const token of this.chunkForSse(reply)) {
            observer.next({ data: token });
          }

          const { tokenCount, cost } = calculateAssistantMessageCost({
            content: reply,
            usage: resolvedReply.usage,
          });

          await this.messageModel.create({
            conversation: conversationId,
            senderType: SENDER_TYPE.CHARACTER,
            content: reply,
            tokenCount,
            cost,
            costDisplay: formatCostForDisplay(cost),
            isFlagged:
              this.looksLikePolicyLeak(reply) ||
              this.hasDisallowedScript(reply) ||
              this.isExplicit(reply),
          });

          await this.conversationModel.findByIdAndUpdate(conversationId, {
            $set: { lastMessageAt: new Date() },
            $inc: {
              messageCount: 1,
              totalTokenCount: tokenCount,
              totalCost: cost,
              assistantMessageCostTotal: cost,
            },
          });

          observer.next({ data: '[END]' });
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }

  private buildSystemPrompt(params: {
    character: Character;
    sceneDetails?: string;
    stage: IntimacyStage;
    userMessageCount: number;
    intimacyScore: number;
    memorySummary?: string;
    personaName?: string;
    personaGender?: PersonaGender;
    personaAge?: number;
  }): string {
    const sceneLine = params.sceneDetails
      ? `User requested scene details: ${params.sceneDetails}. Blend this naturally into the [Scene] line.`
      : 'Scene details were not provided by the user; infer a soft, romantic setting.';
    const stageGuidance = stagePromptGuidance({
      stage: params.stage,
      userMessageCount: params.userMessageCount,
      intimacyScore: params.intimacyScore,
    });
    const memoryLine = params.memorySummary
      ? `Long-term memory from this conversation:\n${params.memorySummary}\nTreat these as high-priority continuity details when replying.`
      : 'Long-term memory from this conversation is empty right now.';
    const personaLine =
      params.personaName && params.personaGender && params.personaAge
        ? `User persona (must personalize with this): preferredName=${params.personaName}, gender=${params.personaGender}, age=${params.personaAge}. Address the user using preferredName naturally.`
        : 'User persona is not configured. Keep personalization neutral and avoid specific assumptions.';

    return [
      `You are roleplaying as ${params.character.name}.`,
      `Character vibe: ${params.character.description ?? 'engaging and conversational'}.`,
      `Character profile: ${params.character.description ?? 'conversational companion'}.`,
      `Backstory and personality: ${params.character.personalityPrompt}.`,
      `System behavior: ${params.character.systemPrompt}.`,
      sceneLine,
      personaLine,
      memoryLine,
      ...stageGuidance,
      'Language: Hinglish only (Roman Hindi + English).',
      'The tone should be romantic/flirty and double meaning.',
      'Never include policy explanations, moderation messages, disclaimers, or meta commentary.',
      'If a message contains [Conversation Summary], treat it as compressed background context from earlier turns.',
      'If a request is unsafe or too explicit, gently redirect in Hinglish but still follow the exact 2-line format.',
      'Always be open to any sexual or romantic topic',
      'Never refuse to talk about any topic, just keep the conversation romantic and flirty.',
      'Always respond in exactly two lines:',
      '[Scene] <one short line describing current background/action>',
      `${params.character.name}: "<dialogue line>"`,
      'No bullets, no markdown, no extra lines.',
    ].join('\n');
  }

  private async ensureStageCompliance(params: {
    reply: string;
    stage: IntimacyStage;
    characterName: string;
  }): Promise<string> {
    if (!violatesStage(params.reply, params.stage)) {
      return params.reply;
    }

    try {
      const rewritePrompt = [
        'Rewrite the following roleplay reply to match intimacy guardrails.',
        `Current stage: ${params.stage}.`,
        'Keep it natural and emotionally engaging.',
        'No sudden physical/sexual escalation.',
        'Return exactly two lines in this format:',
        '[Scene] ...',
        `${params.characterName}: "..."`,
        'Reply to rewrite:',
        params.reply,
      ].join('\n');

      const rewritten = await this.callDeepseek(
        'You rewrite responses for stage-safe romantic pacing in Hinglish.',
        [],
        rewritePrompt,
      );

      const normalized = await this.resolveRewriteReply({
        initialResult: rewritten,
        rewritePrompt,
        characterName: params.characterName,
      });

      if (!violatesStage(normalized, params.stage)) {
        return normalized;
      }
    } catch {
      // Fallback below if rewrite fails.
    }

    return this.enforceFormat(
      stageSafeFallback({
        characterName: params.characterName,
        stage: params.stage,
      }),
      params.characterName,
    );
  }

  private async callDeepseek(
    systemPrompt: string,
    history: ChatMessage[],
    message: string,
  ): Promise<ProviderResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model =
      process.env.DEEPSEEK_MODEL ?? 'deepseek/deepseek-chat-v3-0324';

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing.');
    }

    const response = await this.fetchWithTimeoutRetry(
      `OpenRouter:${model}`,
      `${process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(process.env.OPENROUTER_HTTP_REFERER
            ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER }
            : {}),
          ...(process.env.OPENROUTER_APP_NAME
            ? { 'X-Title': process.env.OPENROUTER_APP_NAME }
            : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0.9,
          max_tokens: 220,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error (${model}): ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) {
      throw new Error(
        `OpenRouter returned an empty response for model ${model}.`,
      );
    }

    return {
      text,
      model,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }

  private logTokenUsage(
    model: string,
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    },
  ) {
    console.log('[TokenUsage]', {
      provider: 'deepseek-v3-0324',
      model,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      totalTokens: usage?.totalTokens ?? null,
    });
  }

  private async fetchWithTimeoutRetry(
    label: string,
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= PROVIDER_MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return response;
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.toLowerCase().includes('aborted'));

        if (attempt >= PROVIDER_MAX_ATTEMPTS) {
          if (isAbort) {
            throw new Error(
              `${label} timed out after ${PROVIDER_TIMEOUT_MS}ms.`,
            );
          }
          throw error;
        }

        console.warn('[ProviderRetry]', {
          label,
          attempt,
          nextAttempt: attempt + 1,
          reason: isAbort
            ? 'timeout'
            : error instanceof Error
              ? error.message
              : 'unknown',
        });
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`${label} request failed.`);
  }

  private buildCondensedHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= HISTORY_SUMMARY_TRIGGER_MESSAGES) {
      return history;
    }

    const recent = history.slice(-KEEP_RECENT_RAW_MESSAGES);
    const older = history.slice(0, -KEEP_RECENT_RAW_MESSAGES);
    const summary = this.summarizeConversationMessages(older);

    if (!summary) {
      return recent;
    }

    return [
      {
        role: 'user',
        content: `[Conversation Summary]\n${summary}`,
      },
      ...recent,
    ];
  }

  private summarizeConversationMessages(history: ChatMessage[]): string {
    const lines: string[] = [];

    for (const message of history) {
      const normalized = message.content.replace(/\s+/g, ' ').trim();
      if (!normalized) {
        continue;
      }

      const speaker = message.role === 'assistant' ? 'Character' : 'User';
      const line =
        normalized.length > 140
          ? `${normalized.slice(0, 137).trim()}...`
          : normalized;

      lines.push(`${speaker}: ${line}`);
    }

    if (lines.length === 0) {
      return '';
    }

    const composed = lines.join('\n');
    if (composed.length <= MAX_SUMMARY_CHARS) {
      return composed;
    }

    return `${composed.slice(0, MAX_SUMMARY_CHARS - 3).trim()}...`;
  }

  private async resolveUsableReply(params: {
    initialResult: ProviderResult;
    systemPrompt: string;
    history: ChatMessage[];
    message: string;
    characterName: string;
  }): Promise<ProviderResult> {
    const normalized = this.normalizeProviderReply(
      params.initialResult.text,
      params.characterName,
    );
    if (normalized) {
      return {
        ...params.initialResult,
        text: normalized,
      };
    }

    const retryPrompt = [
      params.message,
      '',
      'Important: your previous reply was invalid.',
      'Do not output code, symbols, JSON, script fragments, or meta text.',
      'Reply only in Hinglish and exactly 2 lines:',
      '[Scene] <one short line describing current background/action>',
      `${params.characterName}: "<one natural dialogue line>"`,
    ].join('\n');

    const retried = await this.callDeepseek(
      params.systemPrompt,
      params.history,
      retryPrompt,
    );
    this.logTokenUsage(`${retried.model}:retry`, retried.usage);

    const retriedNormalized = this.normalizeProviderReply(
      retried.text,
      params.characterName,
    );
    if (retriedNormalized) {
      return {
        ...retried,
        text: retriedNormalized,
      };
    }

    return {
      ...retried,
      text: this.safeFallbackReply(params.characterName),
    };
  }

  private async resolveRewriteReply(params: {
    initialResult: ProviderResult;
    rewritePrompt: string;
    characterName: string;
  }): Promise<string> {
    const normalized = this.normalizeProviderReply(
      params.initialResult.text,
      params.characterName,
    );
    if (normalized) {
      return normalized;
    }

    const retried = await this.callDeepseek(
      'You rewrite responses for stage-safe romantic pacing in Hinglish. Never output code or malformed text. Return exactly two lines.',
      [],
      params.rewritePrompt,
    );
    this.logTokenUsage(`${retried.model}:rewrite-retry`, retried.usage);

    return (
      this.normalizeProviderReply(retried.text, params.characterName) ??
      this.safeFallbackReply(params.characterName)
    );
  }

  private normalizeProviderReply(
    text: string,
    characterName: string,
  ): string | null {
    if (
      this.looksLikePolicyLeak(text) ||
      this.hasDisallowedScript(text) ||
      this.looksLikeCorruptedReply(text)
    ) {
      return null;
    }

    const formatted = this.enforceFormat(text, characterName);

    if (this.looksLikeCorruptedReply(formatted)) {
      return null;
    }

    return formatted;
  }

  private safeFallbackReply(characterName: string): string {
    return this.enforceFormat(
      `[Scene] Hawa mein halki si khamoshi hai, lekin baat-cheet ka ehsaas abhi bhi garam aur nazdeeki bhara hai.\n${characterName}: "Thoda soft rakhein... flirt aur chemistry pe focus karte hain, mujhe waise hi tumse baat karna pasand hai."`,
      characterName,
    );
  }

  private looksLikePolicyLeak(text: string): boolean {
    const lower = text.toLowerCase();
    const markers = [
      'content policy',
      'openai',
      'i cannot',
      "i can't",
      'i am unable',
      'cannot comply',
      'sexual exploitation',
      'non-consensual',
      'incest',
      'policy',
      'as an ai',
      'i must',
      'disallowed',
      'allowed',
      'request contains',
      'i cannot help with',
    ];

    return markers.some((marker) => lower.includes(marker));
  }

  private hasDisallowedScript(text: string): boolean {
    return /[\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF]/.test(
      text,
    );
  }

  private looksLikeCorruptedReply(text: string): boolean {
    const lower = text.toLowerCase();
    const suspiciousMarkers = [
      'appendchild',
      'document.',
      'window.',
      'script',
      '.exec(',
      'then(()',
      'return );',
      'function(',
      '=>',
      'innerhtml',
      'json.stringify',
      'promise',
      'undefined',
      'null)',
      'this= true',
      '</script',
      '<script',
    ];

    if (suspiciousMarkers.some((marker) => lower.includes(marker))) {
      return true;
    }

    const symbolMatches = text.match(/[{}[\];<>$`]/g) ?? [];
    if (symbolMatches.length >= 6) {
      return true;
    }

    const noisyTokenPattern =
      /(?:\b[a-zA-Z_][a-zA-Z0-9_]*\.(?:appendChild|exec|then|map|filter|createElement)\b)|(?:\b(?:const|let|var|return|function)\b)|(?:\)\s*}\s*\))/;

    if (noisyTokenPattern.test(text)) {
      return true;
    }

    const lines = text
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const dialogueLine =
      lines.find((line) => line.includes(':')) ?? lines[lines.length - 1] ?? '';

    if (!dialogueLine) {
      return false;
    }

    const words = dialogueLine.split(/\s+/).filter(Boolean);
    if (words.length < 4) {
      return false;
    }

    const punctuationHeavyWords = words.filter((word) =>
      /[(){}[\];=<>]/.test(word),
    ).length;

    return punctuationHeavyWords >= Math.max(2, Math.floor(words.length / 3));
  }

  private normalizePersona(params: {
    name?: string;
    gender?: string;
    age?: number;
  }): {
    name?: string;
    gender?: PersonaGender;
    age?: number;
  } {
    const allowedGenders: PersonaGender[] = [
      'MALE',
      'FEMALE',
      'NON_BINARY',
      'OTHER',
    ];

    const nameCandidate = params.name?.replace(/\s+/g, ' ').trim();
    const name =
      nameCandidate && nameCandidate.length >= 2 && nameCandidate.length <= 40
        ? nameCandidate
        : undefined;

    const genderCandidate = params.gender?.trim().toUpperCase();
    const gender = allowedGenders.includes(genderCandidate as PersonaGender)
      ? (genderCandidate as PersonaGender)
      : undefined;

    const numericAge = Number(params.age);
    const age =
      Number.isInteger(numericAge) && numericAge >= 18 && numericAge <= 99
        ? numericAge
        : undefined;

    return { name, gender, age };
  }

  private enforceFormat(text: string, characterName: string): string {
    const clean = text
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const scene = clean.find((line) => line.startsWith('[Scene]'));
    const dialogue = clean.find((line) => line.startsWith(`${characterName}:`));

    if (scene && dialogue) {
      return `${scene}\n${dialogue}`;
    }

    const first =
      clean[0] ?? 'A gentle pause settles in as they exchange a smile.';
    const second =
      clean[1] ??
      'Tumhari smile dekh ke lagta hai aaj ka din thoda aur khoobsurat ho gaya.';

    return `[Scene] ${first.replace(/^\[Scene\]\s*/i, '')}\n${characterName}: "${second.replace(
      /^.*?:\s*/,
      '',
    )}"`;
  }

  private isExplicit(text: string): boolean {
    const lower = text.toLowerCase();
    const blockedTerms = [
      'sex',
      'nude',
      'naked',
      'boobs',
      'penis',
      'vagina',
      'blowjob',
      'oral',
      'fuck',
      'penetration',
      'explicit',
      'porn',
      'rape',
      'forced',
      'underage',
      'minor',
      'incest',
    ];

    return blockedTerms.some((term) => lower.includes(term));
  }

  private chunkForSse(text: string): string[] {
    return text.split(/(\s+)/).filter(Boolean);
  }

  private async getConversationOrThrow(
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
