// ASK-GPT Discover — Cache-Only Feed API
// api/discover.ts

import { supabase } from './_lib/supabaseAdmin.js';
import type { DiscoverTab } from './_lib/discoverSources.js';
import type { DiscoverCard } from './_lib/discoverRss.js';

const DEFAULT_LIMIT = 5;
const MIN_LIMIT = 1;
const MAX_LIMIT = 10;

const COLLECTION: Record<DiscoverTab, string> = {
  foryou: 'discover_foryou_cards',
  bangladesh: 'discover_bangladesh_cards',
};

// ── Cursor encode / decode ────────────────────────────────────────────────────

type CursorData = { cachedAtMs: number; docId: string };

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function decodeCursor(raw: string): CursorData | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      typeof parsed.cachedAtMs === 'number' &&
      typeof parsed.docId === 'string'
    ) {
      return parsed as CursorData;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Card validator ────────────────────────────────────────────────────────────

function isValidCard(card: unknown): card is DiscoverCard {
  if (!card || typeof card !== 'object') return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id === 'string' && c.id.length > 0 &&
    typeof c.image === 'string' && c.image.length > 0 &&
    typeof c.headline === 'string' && c.headline.length > 0 &&
    typeof c.source === 'string' && c.source.length > 0 &&
    typeof c.articleUrl === 'string' && c.articleUrl.length > 0 &&
    typeof c.summary === 'string' && c.summary.length > 0 &&
    Array.isArray(c.bullets)
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  // Method check
  if (req.method !== 'GET') {
    res.status(405).json({
      ok: false,
      mode: 'discover-cache',
      error: 'Method not allowed',
      cards: [],
      hasMore: false,
      nextCursor: null,
    });
    return;
  }

  // Tab
  const rawTab = req.query?.tab;
  const tab: DiscoverTab =
    rawTab === 'foryou' || rawTab === 'bangladesh' ? rawTab : 'foryou';

  // Limit
  const rawLimit = parseInt(String(req.query?.limit ?? ''), 10);
  const limit = isNaN(rawLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(rawLimit, MIN_LIMIT), MAX_LIMIT);

  // Cursor
  const rawCursor = typeof req.query?.cursor === 'string' ? req.query.cursor : null;
  const cursor: CursorData | null = rawCursor ? decodeCursor(rawCursor) : null;

  try {
    const table = COLLECTION[tab];

    // Build query: newest cached cards first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let queryBuilder: any = supabase
      .from(table)
      .select('*')
      .order('cachedAtMs', { ascending: false })
      .limit(limit + 1); // fetch one extra to know if there are more

    // Apply cursor (lt on cachedAtMs)
    if (cursor) {
      queryBuilder = supabase
        .from(table)
        .select('*')
        .order('cachedAtMs', { ascending: false })
        .lt('cachedAtMs', cursor.cachedAtMs)
        .limit(limit + 1);
      // If cursor.cachedAtMs is invalid, returns first page automatically
    }

    const { data: rows, error: queryError } = await queryBuilder;
    if (queryError) throw new Error(queryError.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = (rows ?? []) as any[];

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    // Build cards — skip invalid
    const cards: DiscoverCard[] = [];
    for (const doc of pageDocs) {
      const data = doc;
      if (isValidCard(data)) {
        cards.push(data as DiscoverCard);
      }
    }

    // Build next cursor from last returned doc
    let nextCursor: string | null = null;
    if (hasMore && pageDocs.length > 0) {
      const lastDoc = pageDocs[pageDocs.length - 1];
      nextCursor = encodeCursor({
        cachedAtMs: typeof lastDoc.cachedAtMs === 'number' ? lastDoc.cachedAtMs : 0,
        docId: lastDoc.id,
      });
    }

    if (cards.length === 0 && !cursor) {
      res.status(200).json({
        ok: true,
        mode: 'discover-cache',
        tab,
        limit,
        cards: [],
        cardCount: 0,
        hasMore: false,
        nextCursor: null,
        fromCache: true,
        cacheOnly: true,
        message: 'No cached cards available yet',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      mode: 'discover-cache',
      tab,
      limit,
      cards,
      cardCount: cards.length,
      hasMore,
      nextCursor,
      fromCache: true,
      cacheOnly: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      ok: false,
      mode: 'discover-cache',
      error: message,
      cards: [],
      hasMore: false,
      nextCursor: null,
    });
  }
    }

