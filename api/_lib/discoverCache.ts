// ASK-GPT Discover — Firestore Cache Manager
// api/_lib/discoverCache.ts

import { db } from './firebaseAdmin.js';
import { getDiscoverSources, type DiscoverTab } from './discoverSources.js';
import { fetchDiscoverCardsFromSources, type DiscoverCard } from './discoverRss.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscoverCacheResult = {
  cards: DiscoverCard[];
  fromCache: boolean;
  stale: boolean;
  refreshed: boolean;
  cacheAgeMs: number | null;
};

type CacheDocument = {
  tab: DiscoverTab;
  cards: DiscoverCard[];
  updatedAt: string;
  updatedAtMs: number;
  cardCount: number;
  sourceLimit: number;
  limit: number;
  version: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const COLLECTION = 'discoverFeeds';
const DEFAULT_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CARDS_TO_SAVE = 50;
const CACHE_VERSION = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFeedDocId(tab: DiscoverTab): string {
  return tab === 'foryou' ? 'feed_foryou' : 'feed_bangladesh';
}

function isCacheFresh(updatedAtMs: number, maxAgeMs: number): boolean {
  return Date.now() - updatedAtMs <= maxAgeMs;
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

function sanitizeCards(raw: unknown): DiscoverCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidCard) as DiscoverCard[];
}

function uniqueCards(cards: DiscoverCard[]): DiscoverCard[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  return cards.filter(card => {
    if (seenIds.has(card.id) || seenUrls.has(card.articleUrl)) return false;
    seenIds.add(card.id);
    seenUrls.add(card.articleUrl);
    return true;
  });
}

// ── Firestore read/write ──────────────────────────────────────────────────────

async function readCache(tab: DiscoverTab): Promise<CacheDocument | null> {
  try {
    const docRef = db.collection(COLLECTION).doc(getFeedDocId(tab));
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data() as CacheDocument | undefined;
    if (!data || !Array.isArray(data.cards)) return null;
    return data;
  } catch {
    return null;
  }
}

async function saveCache(
  tab: DiscoverTab,
  cards: DiscoverCard[],
  limit: number,
  sourceLimit: number,
): Promise<void> {
  try {
    const unique = uniqueCards(sanitizeCards(cards));
    const toSave = unique.slice(0, Math.min(Math.max(limit, 30), MAX_CARDS_TO_SAVE));
    const now = Date.now();
    const doc: CacheDocument = {
      tab,
      cards: toSave,
      updatedAt: new Date(now).toISOString(),
      updatedAtMs: now,
      cardCount: toSave.length,
      sourceLimit,
      limit,
      version: CACHE_VERSION,
    };
    await db.collection(COLLECTION).doc(getFeedDocId(tab)).set(doc);
  } catch {
    // Save failure is non-fatal — continue serving data
  }
}

// ── Empty safe result ─────────────────────────────────────────────────────────

function emptyResult(): DiscoverCacheResult {
  return {
    cards: [],
    fromCache: false,
    stale: false,
    refreshed: false,
    cacheAgeMs: null,
  };
}

// ── Main exported function ────────────────────────────────────────────────────

export async function getDiscoverFeedWithCache(params: {
  tab: DiscoverTab;
  limit: number;
  maxAgeMs?: number;
  sourceLimit?: number;
}): Promise<DiscoverCacheResult> {
  const { tab, limit, maxAgeMs = DEFAULT_MAX_AGE_MS, sourceLimit } = params;

  // 1. Read existing cache
  const cached = await readCache(tab);
  const now = Date.now();
  const cacheAgeMs = cached ? now - cached.updatedAtMs : null;
  const fresh = cached ? isCacheFresh(cached.updatedAtMs, maxAgeMs) : false;

  // 2. Return fresh cache immediately
  if (cached && fresh) {
    const cards = sanitizeCards(cached.cards).slice(0, limit);
    return {
      cards,
      fromCache: true,
      stale: false,
      refreshed: false,
      cacheAgeMs,
    };
  }

  // 3. Cache is stale or missing — fetch fresh from RSS
  try {
    const allSources = getDiscoverSources(tab);
    const sources = sourceLimit ? allSources.slice(0, sourceLimit) : allSources;
    const freshCards = await fetchDiscoverCardsFromSources(sources, tab, Math.max(limit, MAX_CARDS_TO_SAVE));

    if (freshCards.length > 0) {
      // 4. Save fresh cards to Firestore
      await saveCache(tab, freshCards, limit, sources.length);

      return {
        cards: freshCards.slice(0, limit),
        fromCache: false,
        stale: false,
        refreshed: true,
        cacheAgeMs: null,
      };
    }

    // Fresh fetch returned 0 cards — fall through to stale fallback
  } catch {
    // Fetch failed — fall through to stale fallback
  }

  // 5. Return stale cache as fallback if available
  if (cached) {
    const cards = sanitizeCards(cached.cards).slice(0, limit);
    return {
      cards,
      fromCache: true,
      stale: true,
      refreshed: false,
      cacheAgeMs,
    };
  }

  // 6. Nothing available — return safe empty result
  return emptyResult();
}

// ── Card lookup by ID (for details page) ─────────────────────────────────────

export async function getCachedDiscoverCardById(id: string): Promise<DiscoverCard | null> {
  if (!id) return null;

  const tabs: DiscoverTab[] = ['foryou', 'bangladesh'];

  for (const tab of tabs) {
    try {
      const cached = await readCache(tab);
      if (!cached) continue;
      const cards = sanitizeCards(cached.cards);
      const match = cards.find(c => c.id === id);
      if (match) return match;
    } catch {
      continue;
    }
  }

  return null;
}
