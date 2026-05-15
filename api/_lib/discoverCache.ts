// ASK-GPT Discover — Supabase Rolling Cache Manager
// api/_lib/discoverCache.ts

import { supabase } from './supabaseAdmin.js';
import { getDiscoverSources, type DiscoverTab, type DiscoverSource } from './discoverSources.js';
import { fetchDiscoverCardsFromSources, type DiscoverCard } from './discoverRss.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscoverCacheResult = {
  cards: DiscoverCard[];
  fromCache: boolean;
  stale: boolean;
  refreshed: boolean;
  cacheAgeMs: number | null;
};

type FeedMeta = {
  tab: DiscoverTab;
  updatedAt: string;
  updatedAtMs: number;
  lastRefreshAt: string;
  lastRefreshAtMs: number;
  lastBatchId: string;
  cardCount: number;
  sourceLimit: number;
  limit: number;
  version: number;
  // Rotation fields
  sourceCursor?: number;
  lastSourceCursor?: number;
  lastSourceIds?: string[];
  lastSourceLabels?: string[];
  lastSourceCount?: number;
  totalSourceCount?: number;
  lastFetchedCardCount?: number;
  lastWrittenCardCount?: number;
};

// A cached card includes all DiscoverCard fields + cache metadata
type CachedCard = DiscoverCard & {
  cachedAt: string;
  cachedAtMs: number;
  batchId: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CARDS_TABLE = 'discover_cards';
const META_TABLE  = 'discover_feed_meta';
const DEFAULT_MAX_AGE_MS = 15 * 60 * 1000;         // 15 minutes
const CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;    // 24 hours
const MAX_CACHED_CARDS_PER_TAB = 3000;              // Emergency safety cap
const SUPABASE_CHUNK = 100;                         // Rows per upsert batch
const CACHE_VERSION = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────



function isCacheFresh(updatedAtMs: number, maxAgeMs: number): boolean {
  if (maxAgeMs === 0) return false; // maxAgeMs: 0 forces refresh
  return Date.now() - updatedAtMs <= maxAgeMs;
}

function makeBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeHeadline(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '').slice(0, 60);
}

function isValidCard(card: unknown): card is DiscoverCard {
  if (!card || typeof card !== 'object') return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id === 'string' && c.id.length > 0 &&
    typeof c.image === 'string' && c.image.length > 0 &&
    typeof c.headline === 'string' && c.headline.length > 0 &&
    typeof c.articleUrl === 'string' && c.articleUrl.length > 0 &&
    typeof c.source === 'string' && c.source.length > 0
  );
}

function emptyResult(): DiscoverCacheResult {
  return { cards: [], fromCache: false, stale: false, refreshed: false, cacheAgeMs: null };
}

// ── Chunk array helper ────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
// ── Rotating source picker ────────────────────────────────────────────────────

function pickRotatingSources(
  allSources: DiscoverSource[],
  sourceLimit: number,
  cursor: number,
): { sources: DiscoverSource[]; startCursor: number; nextCursor: number } {
  const total = allSources.length;
  if (total === 0 || sourceLimit <= 0) {
    return { sources: [], startCursor: 0, nextCursor: 0 };
  }
  // Clamp cursor to valid range
  const start = cursor >= 0 && cursor < total ? cursor : 0;
  const end = start + sourceLimit;

  let sources: DiscoverSource[];
  let nextCursor: number;

  if (end <= total) {
    // Normal slice
    sources = allSources.slice(start, end);
    nextCursor = end >= total ? 0 : end;
  } else {
    // Wrap around
    sources = [...allSources.slice(start), ...allSources.slice(0, end - total)];
    nextCursor = end - total;
  }

  return { sources, startCursor: start, nextCursor };
      }

// ── Read feed meta document ───────────────────────────────────────────────────

async function readFeedMeta(tab: DiscoverTab): Promise<FeedMeta | null> {
  try {
    const { data, error } = await supabase
      .from(META_TABLE).select('*').eq('tab', tab).maybeSingle();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      tab:                  r.tab               as DiscoverTab,
      updatedAt:            r.updated_at         as string,
      updatedAtMs:          r.updated_at_ms      as number,
      lastRefreshAt:        r.last_refresh_at    as string,
      lastRefreshAtMs:      r.last_refresh_at_ms as number,
      lastBatchId:          r.last_batch_id      as string,
      cardCount:            r.card_count         as number,
      sourceLimit:          r.source_limit       as number,
      limit:                r.feed_limit         as number,
      version:              r.version            as number,
      sourceCursor:         r.source_cursor      as number,
      lastSourceCursor:     r.last_source_cursor as number,
      lastSourceIds:        (r.last_source_ids   as string[])  ?? [],
      lastSourceLabels:     (r.last_source_labels as string[]) ?? [],
      lastSourceCount:      r.last_source_count      as number,
      totalSourceCount:     r.total_source_count     as number,
      lastFetchedCardCount: r.last_fetched_card_count as number,
      lastWrittenCardCount: r.last_written_card_count as number,
    };
  } catch {
    return null;
  }
}

// ── Write feed meta document ──────────────────────────────────────────────────

async function writeFeedMeta(_tab: DiscoverTab, meta: FeedMeta): Promise<void> {
  try {
    await supabase.from(META_TABLE).upsert({
      tab:                     meta.tab,
      updated_at:              meta.updatedAt,
      updated_at_ms:           meta.updatedAtMs,
      last_refresh_at:         meta.lastRefreshAt,
      last_refresh_at_ms:      meta.lastRefreshAtMs,
      last_batch_id:           meta.lastBatchId,
      card_count:              meta.cardCount,
      source_limit:            meta.sourceLimit,
      feed_limit:              meta.limit,
      version:                 meta.version,
      source_cursor:           meta.sourceCursor           ?? 0,
      last_source_cursor:      meta.lastSourceCursor       ?? 0,
      last_source_ids:         meta.lastSourceIds          ?? [],
      last_source_labels:      meta.lastSourceLabels       ?? [],
      last_source_count:       meta.lastSourceCount        ?? 0,
      total_source_count:      meta.totalSourceCount       ?? 0,
      last_fetched_card_count: meta.lastFetchedCardCount   ?? 0,
      last_written_card_count: meta.lastWrittenCardCount   ?? 0,
    }, { onConflict: 'tab' });
  } catch { /* non-fatal */ }
}

// ── Read all cached cards from subcollection ──────────────────────────────────

async function readCachedCards(tab: DiscoverTab, limitCount = 500): Promise<CachedCard[]> {
  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE).select('*')
      .eq('tab', tab)
      .order('cached_at_ms', { ascending: false })
      .limit(limitCount);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(r => ({
      id:           r.id            as string,
      tab:          r.tab           as 'foryou' | 'bangladesh',
      image:        r.image         as string,
      source:       r.source        as string,
      sourceAvatar: r.source_avatar as string,
      timeAgo:      r.time_ago      as string,
      headline:     r.headline      as string,
      summary:      r.summary       as string,
      category:     r.category      as string,
      articleUrl:   r.article_url   as string,
      language:     r.language      as 'en' | 'bn',
      bullets:      (r.bullets      as string[]) ?? [],
      sources:      r.sources       as never,
      publishedAt:  r.published_at  as string,
      fetchedAt:    r.fetched_at    as string,
      score:        r.score         as number,
      cachedAt:     r.cached_at     as string,
      cachedAtMs:   r.cached_at_ms  as number,
      batchId:      r.batch_id      as string,
    } as CachedCard)).filter(c => isValidCard(c));
  } catch {
    return [];
  }
      }

// ── Write new cards to subcollection (batched) ────────────────────────────────

async function writeCachedCards(
  _tab: DiscoverTab,
  newCards: DiscoverCard[],
  batchId: string,
  existingIds: Set<string>,
  existingUrls: Set<string>,
  existingHeadlines: Set<string>,
): Promise<number> {
  const now    = Date.now();
  const nowIso = new Date(now).toISOString();

  const toWrite: Record<string, unknown>[] = [];
  for (const card of newCards) {
    if (!isValidCard(card)) continue;
    if (existingIds.has(card.id)) continue;
    if (existingUrls.has(card.articleUrl)) continue;
    if (existingHeadlines.has(normalizeHeadline(card.headline))) continue;
    toWrite.push({
      id:            card.id,
      tab:           card.tab,
      image:         card.image,
      source:        card.source,
      source_avatar: card.sourceAvatar,
      time_ago:      card.timeAgo,
      headline:      card.headline,
      summary:       card.summary       ?? null,
      category:      card.category      ?? null,
      article_url:   card.articleUrl,
      language:      card.language,
      bullets:       card.bullets       ?? [],
      sources:       (card as Record<string, unknown>).sources ?? null,
      published_at:  card.publishedAt,
      fetched_at:    card.fetchedAt,
      score:         card.score,
      cached_at:     nowIso,
      cached_at_ms:  now,
      batch_id:      batchId,
    });
    existingIds.add(card.id);
    existingUrls.add(card.articleUrl);
    existingHeadlines.add(normalizeHeadline(card.headline));
  }

  if (toWrite.length === 0) return 0;

  const chunks = chunkArray(toWrite, SUPABASE_CHUNK);
  for (const chunk of chunks) {
    try {
      await supabase.from(CARDS_TABLE).upsert(chunk, { onConflict: 'id' });
    } catch { /* non-fatal */ }
  }

  return toWrite.length;
      }

// ── Cleanup expired cards (older than 24h by cachedAtMs) ─────────────────────

async function cleanupExpiredCards(tab: DiscoverTab): Promise<void> {
  try {
    const cutoffMs = Date.now() - CACHE_RETENTION_MS;
    await supabase.from(CARDS_TABLE).delete()
      .eq('tab', tab).lt('cached_at_ms', cutoffMs);
  } catch { /* non-fatal */ }
}

// ── Emergency cap: delete oldest cards if over MAX_CACHED_CARDS_PER_TAB ──────

async function applyEmergencyCap(tab: DiscoverTab, totalCount: number): Promise<void> {
  if (totalCount <= MAX_CACHED_CARDS_PER_TAB) return;
  try {
    const overflow = totalCount - MAX_CACHED_CARDS_PER_TAB;
    const { data } = await supabase
      .from(CARDS_TABLE).select('id').eq('tab', tab)
      .order('cached_at_ms', { ascending: true })
      .limit(Math.min(overflow, 500));
    if (!data || data.length === 0) return;
    const ids = (data as { id: string }[]).map(r => r.id);
    await supabase.from(CARDS_TABLE).delete().in('id', ids);
  } catch { /* non-fatal */ }
}

// ── Main exported function ────────────────────────────────────────────────────

export async function getDiscoverFeedWithCache(params: {
  tab: DiscoverTab;
  limit: number;
  maxAgeMs?: number;
  sourceLimit?: number;
}): Promise<DiscoverCacheResult> {
  const { tab, limit, maxAgeMs = DEFAULT_MAX_AGE_MS, sourceLimit } = params;

  // 1. Read meta
  const meta = await readFeedMeta(tab);
  const now = Date.now();
  const cacheAgeMs = meta ? now - meta.updatedAtMs : null;
  const fresh = meta ? isCacheFresh(meta.updatedAtMs, maxAgeMs) : false;

  // 2. Fresh cache — return from subcollection
  if (meta && fresh) {
    const cached = await readCachedCards(tab, limit);
    if (cached.length > 0) {
      const sorted = cached
        .sort((a, b) => b.cachedAtMs - a.cachedAtMs || b.score - a.score)
        .slice(0, limit);
      return { cards: sorted, fromCache: true, stale: false, refreshed: false, cacheAgeMs };
    }
    // Meta says fresh but no cards — fall through to refresh
  }

  // 3. Stale or missing — fetch fresh RSS cards
  try {
    const allSources = getDiscoverSources(tab);
    const batchSize = sourceLimit && sourceLimit > 0 ? sourceLimit : 10;
    const currentCursor = typeof meta?.sourceCursor === 'number' ? meta.sourceCursor : 0;
    const rotation = pickRotatingSources(allSources, batchSize, currentCursor);
    const sources = rotation.sources;
    const freshCards = await fetchDiscoverCardsFromSources(sources, tab, 200);

    if (freshCards.length > 0) {
      const batchId = makeBatchId();

      // Read existing IDs/URLs/headlines for deduplication
      const existing = await readCachedCards(tab, MAX_CACHED_CARDS_PER_TAB);
      const existingIds = new Set(existing.map(c => c.id));
      const existingUrls = new Set(existing.map(c => c.articleUrl));
      const existingHeadlines = new Set(existing.map(c => normalizeHeadline(c.headline)));

      // Write new cards into subcollection (non-destructive merge)
      const written = await writeCachedCards(
        tab, freshCards, batchId, existingIds, existingUrls, existingHeadlines
      );

      // Cleanup expired cards (>24h by cachedAtMs) — fire and forget
      cleanupExpiredCards(tab).catch(() => {});

      // Apply emergency cap if needed
      const newTotal = existing.length + written;
      applyEmergencyCap(tab, newTotal).catch(() => {});

      // Update meta document (with rotation info)
      const nowMs = Date.now();
      await writeFeedMeta(tab, {
        tab,
        updatedAt: new Date(nowMs).toISOString(),
        updatedAtMs: nowMs,
        lastRefreshAt: new Date(nowMs).toISOString(),
        lastRefreshAtMs: nowMs,
        lastBatchId: batchId,
        cardCount: newTotal,
        sourceLimit: sources.length,
        limit,
        version: CACHE_VERSION,
        sourceCursor: rotation.nextCursor,
        lastSourceCursor: rotation.startCursor,
        lastSourceIds: sources.map(s => s.id),
        lastSourceLabels: sources.map(s => s.label),
        lastSourceCount: sources.length,
        totalSourceCount: allSources.length,
        lastFetchedCardCount: freshCards.length,
        lastWrittenCardCount: written,
      });

      // Return merged fresh cache from subcollection
      const allCached = await readCachedCards(tab, limit);
      const sorted = allCached
        .sort((a, b) => b.cachedAtMs - a.cachedAtMs || b.score - a.score)
        .slice(0, limit);

      return { cards: sorted, fromCache: false, stale: false, refreshed: true, cacheAgeMs: null };
    }

    // Fresh fetch returned 0 cards — advance cursor anyway to avoid stuck rotation
    try {
      const nowMs = Date.now();
      await writeFeedMeta(tab, {
        tab,
        updatedAt: meta?.updatedAt ?? new Date(nowMs).toISOString(),
        updatedAtMs: meta?.updatedAtMs ?? nowMs,
        lastRefreshAt: new Date(nowMs).toISOString(),
        lastRefreshAtMs: nowMs,
        lastBatchId: meta?.lastBatchId ?? '',
        cardCount: meta?.cardCount ?? 0,
        sourceLimit: sources.length,
        limit,
        version: CACHE_VERSION,
        sourceCursor: rotation.nextCursor,
        lastSourceCursor: rotation.startCursor,
        lastSourceIds: sources.map(s => s.id),
        lastSourceLabels: sources.map(s => s.label),
        lastSourceCount: sources.length,
        totalSourceCount: allSources.length,
        lastFetchedCardCount: 0,
        lastWrittenCardCount: 0,
      });
    } catch { /* non-fatal */ }

    // Fall through to stale fallback
  } catch {
    // Fetch failed — fall through to stale fallback
  }

  // 4. Stale fallback — return existing cached cards
  const staleCards = await readCachedCards(tab, limit);
  if (staleCards.length > 0) {
    const sorted = staleCards
      .sort((a, b) => b.cachedAtMs - a.cachedAtMs || b.score - a.score)
      .slice(0, limit);
    return { cards: sorted, fromCache: true, stale: true, refreshed: false, cacheAgeMs };
  }

  // 5. Nothing available
  return emptyResult();
}

// ── Card lookup by ID (for details page) ─────────────────────────────────────

export async function getCachedDiscoverCardById(id: string): Promise<DiscoverCard | null> {
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE).select('*').eq('id', id).limit(1).maybeSingle();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    const card: DiscoverCard = {
      id:           r.id            as string,
      tab:          r.tab           as 'foryou' | 'bangladesh',
      image:        r.image         as string,
      source:       r.source        as string,
      sourceAvatar: r.source_avatar as string,
      timeAgo:      r.time_ago      as string,
      headline:     r.headline      as string,
      summary:      r.summary       as string,
      category:     r.category      as string,
      articleUrl:   r.article_url   as string,
      language:     r.language      as 'en' | 'bn',
      bullets:      (r.bullets      as string[]) ?? [],
      sources:      r.sources       as never,
      publishedAt:  r.published_at  as string,
      fetchedAt:    r.fetched_at    as string,
      score:        r.score         as number,
    };
    return isValidCard(card) ? card : null;
  } catch {
    return null;
  }
}
  
