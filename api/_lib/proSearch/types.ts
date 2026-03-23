export type ProSearchCategory =
  | "math"
  | "code"
  | "news"
  | "facts"
  | "local_bd"
  | "weather"
  | "health"
  | "education"
  | "howto";

export type ProSearchTier = "primary" | "secondary" | "tertiary";

export type ProSearchMode = "fast" | "pro";

export interface ProSearchUserQuery {
  text: string;
  mode?: ProSearchMode;
  category?: ProSearchCategory;
  locale?: string;
}

export interface ProSearchPlan {
  normalizedQuery: string;
  category: ProSearchCategory;
  mode: ProSearchMode;
  tiersToTry: ProSearchTier[];
  pureModelFallback: string[];
}

export interface ProSearchSource {
  domain: string;
  label: string;
  note: string;
}

export interface ProSearchHit {
  title: string;
  url: string;
  snippet: string;
  source: ProSearchSource;
  tier: ProSearchTier;
  score: number;
}

export interface ProSearchExtract {
  sourceLabel: string;
  sourceUrl: string;
  tier: ProSearchTier;
  extracted: string[];
  confidence: number;
}

export interface ProSearchAnswer {
  ok: boolean;
  category: ProSearchCategory;
  mode: ProSearchMode;
  usedTier: ProSearchTier | "pure_model";
  normalizedQuery: string;
  hits: ProSearchHit[];
  extracts: ProSearchExtract[];
  finalText: string;
  citations: string[];
  reason?: string;
}

export interface ProSearchCacheEntry {
  key: string;
  value: ProSearchAnswer;
  createdAt: number;
}
