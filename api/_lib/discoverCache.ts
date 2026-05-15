// ASK-GPT Discover — Firestore Rolling Cache Manager
// api/_lib/discoverCache.ts

import { db } from './firebaseAdmin.js';
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

const COLLECTION = 'discoverFeeds';
const CARDS_SUB = 'cards';
const DEFAULT_MAX_AGE_MS = 15 * 60 * 1000;         // 15 minutes
const CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;    // 24 hours
const MAX_CACHED_CARDS_PER_TAB = 3000;              // Emergency safety cap
const FIRESTORE_BATCH_CHUNK = 400;                  // Max ops per batch
const CACHE_VERSION = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFeedDocId(tab: DiscoverTab): string {
  return tab === 'foryou' ? 'feed_foryou' : 'feed_bangladesh';
}

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
    const snap = await db.collection(COLLECTION).doc(getFeedDocId(tab)).get();
    if (!snap.exists) return null;
    return snap.data() as FeedMeta;
  } catch {
    return null;
  }
}

// ── Write feed meta document ──────────────────────────────────────────────────

async function writeFeedMeta(tab: DiscoverTab, meta: FeedMeta): Promise<void> {
  try {
    await db.collection(COLLECTION).doc(getFeedDocId(tab)).set(meta);
  } catch { /* non-fatal */ }
}

// ── Read all cached cards from subcollection ──────────────────────────────────

async function readCachedCards(tab: DiscoverTab, limitCount = 500): Promise<CachedCard[]> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(getFeedDocId(tab))
      .collection(CARDS_SUB)
      .orderBy('cachedAtMs', 'desc')
      .limit(limitCount)
      .get();
    return snap.docs
      .map(d => d.data() as CachedCard)
      .filter(c => isValidCard(c));
  } catch {
    return [];
  }
}

// ── Write new cards to subcollection (batched) ────────────────────────────────

async function writeCachedCards(
  tab: DiscoverTab,
  newCards: DiscoverCard[],
  batchId: string,
  existingIds: Set<string>,
  existingUrls: Set<string>,
  existingHeadlines: Set<string>,
): Promise<number> {
  const feedDocRef = db.collection(COLLECTION).doc(getFeedDocId(tab));
  const cardsRef = feedDocRef.collection(CARDS_SUB);
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

  // Write in chunks of FIRESTORE_BATCH_CHUNK
  const chunks = chunkArray(toWrite, FIRESTORE_BATCH_CHUNK);
  for (const chunk of chunks) {
    try {
      const batch = db.batch();
      for (const card of chunk) {
        const docRef = cardsRef.doc(card.id);
        batch.set(docRef, card);
      }
      await batch.commit();
    } catch { /* non-fatal — continue other chunks */ }
  }

  return toWrite.length;
}

// ── Cleanup expired cards (older than 24h by cachedAtMs) ─────────────────────

async function cleanupExpiredCards(tab: DiscoverTab): Promise<void> {
  try {
    const cutoffMs = Date.now() - CACHE_RETENTION_MS;
    const feedDocRef = db.collection(COLLECTION).doc(getFeedDocId(tab));
    const snap = await feedDocRef
      .collection(CARDS_SUB)
      .where('cachedAtMs', '<', cutoffMs)
      .limit(FIRESTORE_BATCH_CHUNK)
      .get();

    if (snap.empty) return;

    const chunks = chunkArray(snap.docs, FIRESTORE_BATCH_CHUNK);
    for (const chunk of chunks) {
      try {
        const batch = db.batch();
        for (const doc of chunk) batch.delete(doc.ref);
        await batch.commit();
      } catch { /* non-fatal */ }
    }
  } catch { /* non-fatal */ }
}

// ── Emergency cap: delete oldest cards if over MAX_CACHED_CARDS_PER_TAB ──────

async function applyEmergencyCap(tab: DiscoverTab, totalCount: number): Promise<void> {
  if (totalCount <= MAX_CACHED_CARDS_PER_TAB) return;
  try {
    const overflow = totalCount - MAX_CACHED_CARDS_PER_TAB;
    const feedDocRef = db.collection(COLLECTION).doc(getFeedDocId(tab));
    const snap = await feedDocRef
      .collection(CARDS_SUB)
      .orderBy('cachedAtMs', 'asc')
      .limit(Math.min(overflow, FIRESTORE_BATCH_CHUNK))
      .get();

    if (snap.empty) return;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
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

  const tabs: DiscoverTab[] = ['foryou', 'bangladesh'];

  for (const tab of tabs) {
    try {
      const docRef = db
        .collection(COLLECTION)
        .doc(getFeedDocId(tab))
        .collection(CARDS_SUB)
        .doc(id);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (data && isValidCard(data)) return data as DiscoverCard;
      }
    } catch {
      continue;
    }
  }

  return null;
                          }
  
