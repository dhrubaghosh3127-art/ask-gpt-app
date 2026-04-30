export type ReplyMode = 'full' | 'stream';

/**
 * ASK-GPT reply mode switch.
 *
 * full   = old working full reply system
 * stream = new real streaming reply system
 *
 * Default false/old safe mode.
 * App এখনো আগের মতো full reply দিয়েই চলবে।
 */
export const REPLY_MODE: ReplyMode = 'full';

export const USE_STREAMING_REPLY = REPLY_MODE === 'stream';
