// ASK-GPT Discover — Cache-Only Feed API
// api/discover.ts

import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import type { DiscoverTab } from './_lib/discoverSources.js';
import type { DiscoverCard } from './_lib/discoverRss.js';

const DEFAULT_LIMIT = 5;
const MIN_LIMIT     = 1;
const MAX_LIMIT     = 10;

const CARDS_TABLE = 'discover_cards';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidCard(card: unknown): card is DiscoverCard {
  if (!card || typeof card !== 'object') return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id          === 'string' && c.id.length > 0 &&
    typeof c.image       === 'string' && c.image.length > 0 &&
    typeof c.headline    === 'string' && c.headline.length > 0 &&
    typeof c.source      === 'string' && c.source.length > 0 &&
    typeof c.articleUrl  === 'string' && c.articleUrl.length > 0 &&
    typeof c.summary     === 'string' && c.summary.length > 0 &&
    Array.isArray(c.bullets)
  );
}

// ── Supabase row → DiscoverCard mapper ───────────────────────────────────────

function rowToDiscoverCard(row: Record<string, unknown>): DiscoverCard {
  return {
    id:           row.id            as string,
    tab:          row.tab           as 'foryou' | 'bangladesh',
    image:        row.image         as string,
    source:       row.source        as string,
    sourceAvatar: row.source_avatar as string,
    timeAgo:      row.time_ago      as string,
    headline:     row.headline      as string,
    summary:      row.summary       as string,
    category:     row.category      as string,
    articleUrl:   row.article_url   as string,
    language:     row.language      as 'en' | 'bn',
    bullets:      (row.bullets      as string[]) ?? [],
    sources:      row.sources       as never,
    publishedAt:  row.published_at  as string,
    fetchedAt:    row.fetched_at    as string,
    score:        row.score         as number,
  };
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
    // Build Supabase query — fetch limit + 1 to detect hasMore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabaseAdmin
      .from(CARDS_TABLE)
      .select('*')
      .eq('tab', tab)
      .order('cached_at_ms', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    // Apply cursor: fetch rows older than cursor position
    if (cursor) {
      // Use lt on cached_at_ms, or same ms but id < cursor.docId (tie-break)
      query = query.or(
        `cached_at_ms.lt.${cursor.cachedAtMs},and(cached_at_ms.eq.${cursor.cachedAtMs},id.lt.${cursor.docId})`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as Record<string, unknown>[];

    const hasMore  = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    // Build cards — skip invalid
    const cards: DiscoverCard[] = [];
    for (const row of pageRows) {
      const card = rowToDiscoverCard(row);
      if (isValidCard(card)) {
        cards.push(card);
      }
    }

    // Build next cursor from last returned row
    let nextCursor: string | null = null;
    if (hasMore && pageRows.length > 0) {
      const lastRow = pageRows[pageRows.length - 1];
      nextCursor = encodeCursor({
        cachedAtMs: typeof lastRow.cached_at_ms === 'number' ? lastRow.cached_at_ms : 0,
        docId:      String(lastRow.id),
      });
    }

    if (cards.length === 0 && !cursor) {
      res.status(200).json({
        ok:          true,
        mode:        'discover-cache',
        tab,
        limit,
        cards:       [],
        cardCount:   0,
        hasMore:     false,
        nextCursor:  null,
        fromCache:   true,
        cacheOnly:   true,
        message:     'No cached cards available yet',
      });
      return;
    }

    res.status(200).json({
      ok:         true,
      mode:       'discover-cache',
      tab,
      limit,
      cards,
      cardCount:  cards.length,
      hasMore,
      nextCursor,
      fromCache:  true,
      cacheOnly:  true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      ok:         false,
      mode:       'discover-cache',
      error:      message,
      cards:      [],
      hasMore:    false,
      nextCursor: null,
    });
  }
    }
  
