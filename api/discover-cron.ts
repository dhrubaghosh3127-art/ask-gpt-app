// ASK-GPT Discover — Cron Refresh API
// api/discover-cron.ts

import type { DiscoverTab } from './_lib/discoverSources.js';
import { getDiscoverFeedWithCache } from './_lib/discoverCache.js';

const CRON_SOURCE_LIMIT = 10;

// এখনকার existing cache system অনুযায়ী trigger.
// rolling 24h cache পরে discoverCache.ts এ করবো.
const CRON_JOBS: Array<{ tab: DiscoverTab; limit: number }> = [
  { tab: 'foryou', limit: 20 },
  { tab: 'bangladesh', limit: 15 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({
      ok: false,
      error: 'Method not allowed',
    });
    return;
  }

  const secret = String(req.query?.secret ?? '');
  const expectedSecret = process.env.DISCOVER_CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    res.status(401).json({
      ok: false,
      error: 'Unauthorized',
    });
    return;
  }

  const startedAt = new Date().toISOString();

  try {
    const results = await Promise.allSettled(
      CRON_JOBS.map(async (job) => {
        const result = await getDiscoverFeedWithCache({
          tab: job.tab,
          limit: job.limit,

          // 0 দিলে cache stale ধরার চেষ্টা করবে,
          // মানে cron hit করলেই refresh trigger হবে।
          maxAgeMs: 0,

          // এখন safe রাখছি, পরে batch/rotation system করবো।
          sourceLimit: CRON_SOURCE_LIMIT,
        });

        return {
          tab: job.tab,
          ok: true,
          cardCount: result.cards?.length ?? 0,
          fromCache: result.fromCache,
          stale: result.stale,
          refreshed: result.refreshed,
          cacheAgeMs: result.cacheAgeMs,
        };
      }),
    );

    res.status(200).json({
      ok: true,
      mode: 'discover-cron',
      startedAt,
      finishedAt: new Date().toISOString(),
      results: results.map((r, index) => {
        if (r.status === 'fulfilled') return r.value;

        return {
          tab: CRON_JOBS[index]?.tab,
          ok: false,
          error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mode: 'discover-cron',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
