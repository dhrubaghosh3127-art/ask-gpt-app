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
const META_TABLE = 'discover_feed_meta';
const DEFAULT_MAX_AGE_MS = 15 * 60 * 1000;         // 15 minutes
const CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;    // 24 hours
const MAX_CACHED_CARDS_PER_TAB = 3000;              // Emergency safety cap
const SUPABASE_CHUNK = 100;                         // Max rows per upsert batch
const CACHE_VERSION = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCacheFresh(updatedAtMs: number, maxAgeMs: number): boolean {
  if (maxAgeMs === 0) return false;
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
  const start = cursor >= 0 && cursor < total ? cursor : 0;
  const end = start + sourceLimit;

  let sources: DiscoverSource[];
  let nextCursor: number;

  if (end <= total) {
    sources = allSources.slice(start, end);
    nextCursor = end >= total ? 0 : end;
  } else {
    sources = [...allSources.slice(start), ...allSources.slice(0, end - total)];
    nextCursor = end - total;
  }

  return { sources, startCursor: start, nextCursor };
}

// ── Row mappers ───────────────────────────────────────────────────────────────

// DB row (snake_case) → FeedMeta (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFeedMeta(row: Record<string, any>): FeedMeta {
  return {
    tab: row.tab,
    updatedAt: row.updated_at ?? '',
    updatedAtMs: row.updated_at_ms ?? 0,
    lastRefreshAt: row.last_refresh_at ?? '',
    lastRefreshAtMs: row.last_refresh_at_ms ?? 0,
    lastBatchId: row.last_batch_id ?? '',
    cardCount: row.card_count ?? 0,
    sourceLimit: row.source_limit ?? 0,
    limit: row.limit_count ?? 20,
    version: row.version ?? CACHE_VERSION,
    sourceCursor: row.source_cursor ?? undefined,
    lastSourceCursor: row.last_source_cursor ?? undefined,
    lastSourceIds: row.last_source_ids ?? undefined,
    lastSourceLabels: row.last_source_labels ?? undefined,
    lastSourceCount: row.last_source_count ?? undefined,
    totalSourceCount: row.total_source_count ?? undefined,
    lastFetchedCardCount: row.last_fetched_card_count ?? undefined,
    lastWrittenCardCount: row.last_written_card_count ?? undefined,
  };
}

// FeedMeta (camelCase) → DB row (snake_case)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function feedMetaToRow(meta: FeedMeta): Record<string, any> {
  return {
    tab: meta.tab,
    updated_at: meta.updatedAt,
    updated_at_ms: meta.updatedAtMs,
    last_refresh_at: meta.lastRefreshAt,
    last_refresh_at_ms: meta.lastRefreshAtMs,
    last_batch_id: meta.lastBatchId,
    card_count: meta.cardCount,
    source_limit: meta.sourceLimit,
    limit_count: meta.limit,
    version: meta.version,
    source_cursor: meta.sourceCursor ?? null,
    last_source_cursor: meta.lastSourceCursor ?? null,
    last_source_ids: meta.lastSourceIds ?? null,
    last_source_labels: meta.lastSourceLabels ?? null,
    last_source_count: meta.lastSourceCount ?? null,
    total_source_count: meta.totalSourceCount ?? null,
    last_fetched_card_count: meta.lastFetchedCardCount ?? null,
    last_written_card_count: meta.lastWrittenCardCount ?? null,
  };
}

// DB row (snake_case) → CachedCard (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCachedCard(row: Record<string, any>): CachedCard {
  return {
    id: row.id,
    tab: row.tab,
    image: row.image,
    source: row.source,
    sourceAvatar: row.source_avatar ?? '',
    timeAgo: row.time_ago ?? '',
    headline: row.headline,
    summary: row.summary ?? '',
    category: row.category ?? '',
    articleUrl: row.article_url,
    language: row.language ?? 'en',
    bullets: Array.isArray(row.bullets) ? row.bullets : [],
    publishedAt: row.published_at ?? '',
    fetchedAt: row.fetched_at ?? '',
    score: row.score ?? 0,
    cachedAt: row.cached_at ?? '',
    cachedAtMs: row.cached_at_ms ?? 0,
    batchId: row.batch_id ?? '',
  };
}

// CachedCard (camelCase) → DB row (snake_case)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cachedCardToRow(card: CachedCard): Record<string, any> {
  return {
    id: card.id,
    tab: card.tab,
    image: card.image,
    source: card.source,
    source_avatar: card.sourceAvatar,
    time_ago: card.timeAgo,
    headline: card.headline,
    summary: card.summary,
    category: card.category,
    article_url: card.articleUrl,
    language: card.language,
    bullets: card.bullets,
    published_at: card.publishedAt,
    fetched_at: card.fetchedAt,
    score: card.score,
    cached_at: card.cachedAt,
    cached_at_ms: card.cachedAtMs,
    batch_id: card.batchId,
  };
}

// ── Read feed meta ────────────────────────────────────────────────────────────

async function readFeedMeta(tab: DiscoverTab): Promise<FeedMeta | null> {
  try {
    const { data, error } = await supabase
      .from(META_TABLE)
      .select('*')
      .eq('tab', tab)
      .single();
    if (error || !data) return null;
    return rowToFeedMeta(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

// ── Write feed meta ───────────────────────────────────────────────────────────

async function writeFeedMeta(tab: DiscoverTab, meta: FeedMeta): Promise<void> {
  try {
    await supabase
      .from(META_TABLE)
      .upsert(feedMetaToRow(meta), { onConflict: 'tab' });
  } catch { /* non-fatal */ }
}

// ── Read cached cards ─────────────────────────────────────────────────────────

async function readCachedCards(tab: DiscoverTab, limitCount = 500): Promise<CachedCard[]> {
  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE)
      .select('*')
      .eq('tab', tab)
      .order('cached_at_ms', { ascending: false })
      .limit(limitCount);
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .map(rowToCachedCard)
      .filter(c => isValidCard(c));
  } catch {
    return [];
  }
}

// ── Write new cards (deduplicated) ────────────────────────────────────────────

async function writeCachedCards(
  tab: DiscoverTab,
  newCards: DiscoverCard[],
  batchId: string,
  existingIds: Set<string>,
  existingUrls: Set<string>,
  existingHeadlines: Set<string>,
): Promise<number> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // Filter out duplicates
  const toWrite: CachedCard[] = [];
  for (const card of newCards) {
    if (!isValidCard(card)) continue;
    if (existingIds.has(card.id)) continue;
    if (existingUrls.has(card.articleUrl)) continue;
    if (existingHeadlines.has(normalizeHeadline(card.headline))) continue;
    toWrite.push({
      ...card,
      cachedAt: nowIso,
      cachedAtMs: now,
      batchId,
    });
    existingIds.add(card.id);
    existingUrls.add(card.articleUrl);
    existingHeadlines.add(normalizeHeadline(card.headline));
  }

  if (toWrite.length === 0) return 0;

  // Upsert in chunks
  const chunks = chunkArray(toWrite, SUPABASE_CHUNK);
  for (const chunk of chunks) {
    try {
      await supabase
        .from(CARDS_TABLE)
        .upsert(chunk.map(cachedCardToRow), { onConflict: 'id' });
    } catch { /* non-fatal — continue other chunks */ }
  }

  return toWrite.length;
}

// ── Cleanup expired cards (older than 24h by cachedAtMs) ─────────────────────

async function cleanupExpiredCards(tab: DiscoverTab): Promise<void> {
  try {
    const cutoffMs = Date.now() - CACHE_RETENTION_MS;
    await supabase
      .from(CARDS_TABLE)
      .delete()
      .eq('tab', tab)
      .lt('cached_at_ms', cutoffMs);
  } catch { /* non-fatal */ }
}

// ── Emergency cap: delete oldest cards if over MAX_CACHED_CARDS_PER_TAB ──────

async function applyEmergencyCap(tab: DiscoverTab, totalCount: number): Promise<void> {
  if (totalCount <= MAX_CACHED_CARDS_PER_TAB) return;
  try {
    const overflow = totalCount - MAX_CACHED_CARDS_PER_TAB;
    const { data } = await supabase
      .from(CARDS_TABLE)
      .select('id')
      .eq('tab', tab)
      .order('cached_at_ms', { ascending: true })
      .limit(overflow);
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

  // 2. Fresh cache — return from Supabase
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

      // Write new cards (non-destructive merge)
      const written = await writeCachedCards(
        tab, freshCards, batchId, existingIds, existingUrls, existingHeadlines
      );

      // Cleanup expired cards (>24h by cachedAtMs) — fire and forget
      cleanupExpiredCards(tab).catch(() => {});

      // Apply emergency cap if needed
      const newTotal = existing.length + written;
      applyEmergencyCap(tab, newTotal).catch(() => {});

      // Update meta (with rotation info)
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

      // Return merged fresh cache
      const allCached = await readCachedCards(tab, limit);
      const sorted = allCached
        .sort((a, b) => b.cachedAtMs - a.cachedAtMs || b.score - a.score)
        .slice(0, limit);

      return { cards: sorted, fromCache: false, stale: false, refreshed: true, cacheAgeMs: null };
    }

    // Fresh fetch returned 0 cards — advance cursor anyway
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
      .from(CARDS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    const card = rowToCachedCard(data as Record<string, unknown>);
    return isValidCard(card) ? card : null;
  } catch {
    return null;
  }
}
