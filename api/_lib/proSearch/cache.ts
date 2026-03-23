import type {
  ProSearchAnswer,
  ProSearchCacheEntry,
  ProSearchCategory,
  ProSearchMode,
} from "./types.js";

const PRO_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

const memoryCache = new Map<string, ProSearchCacheEntry>();

const normalizeText = (text: string): string =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const buildProSearchCacheKey = (
  query: string,
  category: ProSearchCategory,
  mode: ProSearchMode
): string => {
  return `${category}::${mode}::${normalizeText(query)}`;
};

export const getProSearchCache = (
  key: string
): ProSearchAnswer | null => {
  const found = memoryCache.get(key);

  if (!found) {
    return null;
  }

  const isExpired =
    Date.now() - found.createdAt > PRO_SEARCH_CACHE_TTL_MS;

  if (isExpired) {
    memoryCache.delete(key);
    return null;
  }

  return found.value;
};

export const setProSearchCache = (
  key: string,
  value: ProSearchAnswer
): void => {
  memoryCache.set(key, {
    key,
    value,
    createdAt: Date.now(),
  });
};

export const clearExpiredProSearchCache = (): void => {
  const now = Date.now();

  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.createdAt > PRO_SEARCH_CACHE_TTL_MS) {
      memoryCache.delete(key);
    }
  }
};

export const clearAllProSearchCache = (): void => {
  memoryCache.clear();
};
