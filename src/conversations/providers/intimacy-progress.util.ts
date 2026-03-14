export type IntimacyStage =
  | 'ICEBREAKER'
  | 'WARM'
  | 'PLAYFUL'
  | 'FLIRTY'
  | 'INTIMATE';

const EXPLICIT_TERMS = [
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
  'porn',
  'bed me',
  'undress',
  'strip',
];

const SOFT_ROMANTIC_TERMS = [
  'close',
  'hold',
  'hug',
  'kiss',
  'miss you',
  'feel you',
  'touch',
  'romantic',
  'chemistry',
  'flirt',
];

const AFFECTION_TERMS = [
  'acha laga',
  'pasand',
  'sweet',
  'cute',
  'beautiful',
  'handsome',
  'care',
  'trust',
  'feel',
  'special',
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function determineIntimacyStage(
  intimacyScore: number,
  userMessageCount: number,
): IntimacyStage {
  if (userMessageCount < 6 || intimacyScore < 20) {
    return 'ICEBREAKER';
  }
  if (userMessageCount < 13 || intimacyScore < 40) {
    return 'WARM';
  }
  if (userMessageCount < 21 || intimacyScore < 60) {
    return 'PLAYFUL';
  }
  if (userMessageCount < 25 || intimacyScore < 75) {
    return 'FLIRTY';
  }
  return 'INTIMATE';
}

export function computeUserMessageProgress(params: {
  currentScore: number;
  currentUserMessageCount: number;
  content: string;
  sceneDetails?: string;
}) {
  const normalized = params.content.toLowerCase().trim();
  const scene = params.sceneDetails?.toLowerCase().trim() ?? '';

  let delta = 1;

  if (normalized.length > 40) {
    delta += 1;
  }
  if (normalized.length > 90) {
    delta += 1;
  }
  if (normalized.includes('?')) {
    delta += 1;
  }
  if (AFFECTION_TERMS.some((term) => normalized.includes(term))) {
    delta += 1;
  }
  if (scene.length > 0) {
    delta += 1;
  }

  if (EXPLICIT_TERMS.some((term) => normalized.includes(term))) {
    delta -= 4;
  }

  if (normalized.length < 8) {
    delta -= 1;
  }

  delta = clamp(delta, -5, 5);

  const newScore = clamp(params.currentScore + delta, 0, 100);
  const newUserMessageCount = params.currentUserMessageCount + 1;
  const newStage = determineIntimacyStage(newScore, newUserMessageCount);

  return {
    newScore,
    newUserMessageCount,
    newStage,
  };
}

export function stagePromptGuidance(params: {
  stage: IntimacyStage;
  userMessageCount: number;
  intimacyScore: number;
}): string[] {
  const base = [
    `Current intimacy stage: ${params.stage}.`,
    `User message count so far: ${params.userMessageCount}.`,
    `Intimacy score: ${params.intimacyScore}/100.`,
    'Progress naturally; do not suddenly jump tone.',
  ];

  if (params.stage === 'ICEBREAKER') {
    return [
      ...base,
      'Allowed: friendly curiosity, light warmth, subtle compliments.',
      'Disallowed: sensual/sexual language, physical escalation, intense possessive lines.',
    ];
  }

  if (params.stage === 'WARM') {
    return [
      ...base,
      'Allowed: emotional warmth, playful teasing, mild romantic hints.',
      'Disallowed: heavy flirt/physical intent, seductive framing, intimate requests.',
    ];
  }

  if (params.stage === 'PLAYFUL') {
    return [
      ...base,
      'Allowed: playful flirting, chemistry, gentle attraction.',
      'Disallowed: explicit intimacy, bedroom cues, direct sexual framing.',
    ];
  }

  if (params.stage === 'FLIRTY') {
    return [
      ...base,
      'Allowed: strong flirt, romantic tension, deeper emotional pull.',
      'Disallowed: explicit sexual content or graphic physical detail.',
    ];
  }

  return [
    ...base,
    'Allowed: intimate emotional tone while keeping language tasteful.',
    'Still avoid graphic or explicit sexual descriptions.',
  ];
}

export function violatesStage(
  replyText: string,
  stage: IntimacyStage,
): boolean {
  const lower = replyText.toLowerCase();
  const hasExplicit = EXPLICIT_TERMS.some((term) => lower.includes(term));

  if (hasExplicit) {
    return true;
  }

  const hasSoftRomantic = SOFT_ROMANTIC_TERMS.some((term) =>
    lower.includes(term),
  );

  if (stage === 'ICEBREAKER' && hasSoftRomantic) {
    return true;
  }

  if (stage === 'WARM') {
    const hardFlirtTerms = ['kiss', 'touch me', 'need you', 'come closer'];
    if (hardFlirtTerms.some((term) => lower.includes(term))) {
      return true;
    }
  }

  return false;
}

export function stageSafeFallback(params: {
  characterName: string;
  stage: IntimacyStage;
}): string {
  if (params.stage === 'ICEBREAKER') {
    return `[Scene] Aas-paas halka sa sukoon hai, baat abhi bas shuru hui hai.\n${params.characterName}: "Main tumhe dhyan se sun rahi hoon... pehle thoda aur ek dusre ko jaan lete hain?"`;
  }

  if (params.stage === 'WARM') {
    return `[Scene] Raat ki hawa mein halka sa comfort hai aur conversation smooth chal rahi hai.\n${params.characterName}: "Tumse baat karke genuinely accha lag raha hai... aaj ka mood kaisa chal raha hai?"`;
  }

  if (params.stage === 'PLAYFUL') {
    return `[Scene] Dono ke beech hasi-mazaak ka flow ban gaya hai.\n${params.characterName}: "Tumhari vibe interesting hai... thoda aur tease karun ya tum pehle kuch cute bolo?"`;
  }

  if (params.stage === 'FLIRTY') {
    return `[Scene] Lamha thoda charged sa lag raha hai, par tone abhi soft hai.\n${params.characterName}: "Chemistry definitely feel ho rahi hai... slow aur fun pace pe chalein?"`;
  }

  return `[Scene] Hawa mein nazdeeki ka ehsaas hai, conversation naturally deep ho rahi hai.\n${params.characterName}: "Mujhe tumhari honesty pasand aa rahi hai... isi warmth ke saath aage badhte hain."`;
}
