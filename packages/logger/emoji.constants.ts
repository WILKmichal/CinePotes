
export const LOG_EMOJI = {
  APP_START: '🚀',
  ACTION_START: '🎬',
  SUCCESS: '✅', 
  ERROR: '👹',
  REDIS: '💾',
} as const;

export type LogEmojiKey = keyof typeof LOG_EMOJI;
