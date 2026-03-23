import type { ProSearchAnswer, ProSearchUserQuery } from "./types.js";
import { buildProSearchPlan } from "./planner.js";
import {
  buildProSearchCacheKey,
  clearExpiredProSearchCache,
  getProSearchCache,
  setProSearchCache,
} from "./cache.js";
import { runProSearchExecutor } from "./executor.js";

export const runProSearch = async ({
  apiKey,
  input,
}: {
  apiKey: string;
  input: ProSearchUserQuery;
}): Promise<ProSearchAnswer> => {
  clearExpiredProSearchCache();

  const plan = buildProSearchPlan(input);

  const cacheKey = buildProSearchCacheKey(
    plan.normalizedQuery,
    plan.category,
    plan.mode
  );

  const cached = getProSearchCache(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await runProSearchExecutor({
    apiKey,
    plan,
  });

  if (result.ok) {
    setProSearchCache(cacheKey, result);
  }

  return result;
};
