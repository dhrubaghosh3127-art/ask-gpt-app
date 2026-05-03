// ASK-GPT Discover — Feed API Route
// api/discover.ts

import type { DiscoverTab } from './_lib/discoverSources.js';
import { getDiscoverFeedWithCache } from './_lib/discoverCache.js';

const MAX_AGE_MS = 15 * 60 * 1000;
const SOURCE_LIMIT = 10;

const DEFAULT_LIMITS: Record<DiscoverTab, number> = {
  foryou: 20,
  bangladesh: 10,
};

const MAX_LIMITS: Record<DiscoverTab, number> = {
  foryou: 25,
  bangladesh: 15,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  // 1. Method check
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed', cards: [] });
    return;
  }

  // 2. Tab
  const rawTab = req.query?.tab;
  const tab: DiscoverTab =
    rawTab === 'foryou' || rawTab === 'bangladesh' ? rawTab : 'foryou';

  // 3. Limit — parse, default, clamp
  const rawLimit = parseInt(String(req.query?.limit ?? ''), 10);
  const defaultLimit = DEFAULT_LIMITS[tab];
  const maxLimit = MAX_LIMITS[tab];
  const limit = isNaN(rawLimit)
    ? defaultLimit
    : Math.min(Math.max(rawLimit, 1), maxLimit);

  // 4. Fetch with cache
  try {
    const result = await getDiscoverFeedWithCache({
      tab,
      limit,
      maxAgeMs: MAX_AGE_MS,
      sourceLimit: SOURCE_LIMIT,
    });

    res.status(200).json({
      ok: true,
      mode: 'discover',
      tab,
      limit,
      cardCount: result.cards.length,
      fromCache: result.fromCache,
      stale: result.stale,
      refreshed: result.refreshed,
      cacheAgeMs: result.cacheAgeMs,
      cards: result.cards,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      ok: false,
      mode: 'discover',
      error: message,
      cards: [],
    });
  }
                                   }
