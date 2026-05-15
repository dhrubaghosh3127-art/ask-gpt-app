// ASK-GPT Discover — Debug Status API
// api/discover-debug.ts

import { supabase } from './_lib/supabaseAdmin.js';

type DiscoverTab = 'foryou' | 'bangladesh';

const COLLECTION = 'discover_feed_meta';
const SAMPLE_LIMIT = 10;
const RECENT_SCAN_LIMIT = 80;

function getFeedDocId(tab: DiscoverTab): string {
  return tab === 'foryou' ? 'feed_foryou' : 'feed_bangladesh';
}

function minutesAgo(ms?: number | null): number | null {
  if (!ms || typeof ms !== 'number') return null;
  return Math.round((Date.now() - ms) / 60000);
}

function isBadLine(text: unknown): boolean {
  if (typeof text !== 'string') return false;
  const t = text.toLowerCase();
  return (
    t.includes('reported on this story') ||
    t.includes('follow the full article') ||
    t.includes('complete details') ||
    t.includes('expert analysis') ||
    t.includes('read more') ||
    t.includes('click here') ||
    t.includes('for more') ||
    text.includes('বিস্তারিত জানতে') ||
    text.includes('সম্পূর্ণ প্রতিবেদন')
  );
}

async function safeCount(table: string): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (!error && count !== null) return count;
  } catch {
    // fallback below
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(5000);
    if (!error && data) return data.length;
  } catch {
    return null;
  }
  return null;
}

async function inspectTab(tab: DiscoverTab) {
  const feedDocId = getFeedDocId(tab);
  const cardsTable = tab === 'foryou' ? 'discover_foryou_cards' : 'discover_bangladesh_cards';

  const { data: metaRow } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('feed_doc_id', feedDocId)
    .single();
  const meta = metaRow || null;

  const actualCardCount = await safeCount(cardsTable);

  const { data: recentRows } = await supabase
    .from(cardsTable)
    .select('*')
    .order('cachedAtMs', { ascending: false })
    .limit(RECENT_SCAN_LIMIT);

  const recentDocs = (recentRows ?? []).map((row: any) => ({
    docId: row.id,
    ...row,
  }));

  const sampleCards = recentDocs.slice(0, SAMPLE_LIMIT).map((card: any) => ({
    id: card.id || card.docId,
    headline: card.headline || null,
    source: card.source || null,
    category: card.category || null,
    language: card.language || null,
    cachedAt: card.cachedAt || null,
    cachedAtMs: card.cachedAtMs || null,
    cachedAgeMin: minutesAgo(card.cachedAtMs),
    publishedAt: card.publishedAt || null,
    image: card.image || null,
    articleUrl: card.articleUrl || null,
    summary: card.summary || null,
    bullets: Array.isArray(card.bullets) ? card.bullets : [],
    hasImage: typeof card.image === 'string' && card.image.length > 5,
    hasArticleUrl: typeof card.articleUrl === 'string' && card.articleUrl.length > 5,
    hasSummary: typeof card.summary === 'string' && card.summary.length > 5,
    bulletCount: Array.isArray(card.bullets) ? card.bullets.length : 0,
    hasBadBullet: Array.isArray(card.bullets) ? card.bullets.some(isBadLine) : false,
    batchId: card.batchId || null,
  }));

  const quality = {
    scannedRecent: recentDocs.length,
    missingImage: recentDocs.filter((c: any) => !(typeof c.image === 'string' && c.image.length > 5)).length,
    missingArticleUrl: recentDocs.filter((c: any) => !(typeof c.articleUrl === 'string' && c.articleUrl.length > 5)).length,
    missingSummary: recentDocs.filter((c: any) => !(typeof c.summary === 'string' && c.summary.length > 5)).length,
    missingBullets: recentDocs.filter((c: any) => !(Array.isArray(c.bullets) && c.bullets.length > 0)).length,
    badFillerBullets: recentDocs.filter((c: any) => Array.isArray(c.bullets) && c.bullets.some(isBadLine)).length,
  };

  const batchCounts: Record<string, number> = {};
  for (const card of recentDocs) {
    const batchId = typeof card.batchId === 'string' ? card.batchId : 'no_batch';
    batchCounts[batchId] = (batchCounts[batchId] || 0) + 1;
  }

  return {
    tab,
    feedDocId,
    metaExists: meta !== null,
    meta: meta ? {
      cardCount: meta.cardCount ?? null,
      lastBatchId: meta.lastBatchId ?? null,
      lastRefreshAt: meta.lastRefreshAt ?? null,
      lastRefreshAtMs: meta.lastRefreshAtMs ?? null,
      lastRefreshAgeMin: minutesAgo(meta.lastRefreshAtMs),
      updatedAt: meta.updatedAt ?? null,
      updatedAtMs: meta.updatedAtMs ?? null,
      updatedAgeMin: minutesAgo(meta.updatedAtMs),
      sourceLimit: meta.sourceLimit ?? null,
      limit: meta.limit ?? null,
      version: meta.version ?? null,
    } : null,
    actualCardCount,
    recentBatchCounts: batchCounts,
    quality,
    sampleCards,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const configuredSecret = process.env.DISCOVER_CRON_SECRET;
  const givenSecret = typeof req.query?.secret === 'string' ? req.query.secret : '';

  // Safety: if secret exists in Vercel env, require it.
  if (configuredSecret && givenSecret !== configuredSecret) {
    res.status(401).json({
      ok: false,
      mode: 'discover-debug',
      error: 'Unauthorized. Add ?secret=YOUR_DISCOVER_CRON_SECRET',
    });
    return;
  }

  try {
    const foryou = await inspectTab('foryou');
    const bangladesh = await inspectTab('bangladesh');

    res.status(200).json({
      ok: true,
      mode: 'discover-debug',
      generatedAt: new Date().toISOString(),
      note: 'Read-only debug. This endpoint does not write, delete, or refresh news.',
      tabs: {
        foryou,
        bangladesh,
      },
      quickRead: {
        foryouCards: foryou.actualCardCount,
        bangladeshCards: bangladesh.actualCardCount,
        foryouLastRefreshAgeMin: foryou.meta?.lastRefreshAgeMin ?? null,
        bangladeshLastRefreshAgeMin: bangladesh.meta?.lastRefreshAgeMin ?? null,
        foryouBadFillerBulletsInRecent: foryou.quality.badFillerBullets,
        bangladeshBadFillerBulletsInRecent: bangladesh.quality.badFillerBullets,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      ok: false,
      mode: 'discover-debug',
      error: message,
    });
  }
    }
      
