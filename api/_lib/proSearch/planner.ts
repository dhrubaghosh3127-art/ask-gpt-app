import type {
  ProSearchPlan,
  ProSearchSource,
  ProSearchTier,
  ProSearchTierQuery,
  ProSearchUserQuery,
} from "./types.js";
import { PRO_SEARCH_SOURCE_REGISTRY } from "./sourceRegistry.js";

const normalizeProSearchText = (text: string): string =>
  String(text || "")
    .trim()
    .replace(/\s+/g, " ");

const getTierSources = (
  category: ProSearchUserQuery["category"]
): Record<ProSearchTier, ProSearchSource[]> => {
  const safeCategory = category || "facts";
  return {
    primary: PRO_SEARCH_SOURCE_REGISTRY[safeCategory].primary,
    secondary: PRO_SEARCH_SOURCE_REGISTRY[safeCategory].secondary,
    tertiary: PRO_SEARCH_SOURCE_REGISTRY[safeCategory].tertiary,
  };
};

const buildTierQueryText = (query: string, domains: string[]): string => {
  if (!domains.length) return query;

  const sitePart = domains.map((domain) => `site:${domain}`).join(" OR ");
  return `${query} (${sitePart})`;
};

export const buildProSearchPlan = (
  input: ProSearchUserQuery
): ProSearchPlan => {
  const category = input.category || "facts";
  const mode = input.mode;
  const normalizedQuery = normalizeProSearchText(input.text);
  const tierSources = getTierSources(category);

  const tiersToTry: ProSearchTier[] =
    mode === "fast"
      ? ["primary"]
      : ["primary", "secondary", "tertiary"];

  const tierQueries: ProSearchTierQuery[] = tiersToTry.map((tier) => {
    const domains = tierSources[tier].map((item) => item.domain).filter(Boolean);

    return {
      tier,
      query: buildTierQueryText(normalizedQuery, domains),
      domains,
    };
  });

  return {
    normalizedQuery,
    category,
    mode,
    tiersToTry,
    tierQueries,
    pureModelFallback: [
      ...PRO_SEARCH_SOURCE_REGISTRY[category].pureModelFallback,
    ],
  };
};
