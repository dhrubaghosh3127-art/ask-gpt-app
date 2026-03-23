import type {
  ProSearchAnswer,
  ProSearchPlan,
  ProSearchTier,
} from "./types.js";
import { runProSearchTier } from "./searchClient.js";

const isUsefulResult = (text: string): boolean => {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return t.length > 20 && t !== "no_result";
};

export const runProSearchExecutor = async ({
  apiKey,
  plan,
}: {
  apiKey: string;
  plan: ProSearchPlan;
}): Promise<ProSearchAnswer> => {
  const hits: any[] = [];
  const extracts: any[] = [];

  let finalText = "";
  let usedTier: ProSearchTier | "pure_model" = "primary";

  // 🔹 Tier loop (PRIMARY → SECONDARY → TERTIARY)
  for (const tierQuery of plan.tierQueries) {
    const result = await runProSearchTier({
      apiKey,
      category: plan.category,
      normalizedQuery: plan.normalizedQuery,
      tierQuery,
      mode: plan.mode,
    });

    if (!result.ok) continue;

    if (!isUsefulResult(result.text)) continue;

    finalText = result.text;
    usedTier = tierQuery.tier;

    hits.push({
      title: `${tierQuery.tier} result`,
      url: "",
      snippet: result.text.slice(0, 200),
      source: {
        domain: "web",
        label: "web",
        note: "auto",
      },
      tier: tierQuery.tier,
      score: 1,
    });

    extracts.push({
      sourceLabel: "web",
      sourceUrl: "",
      tier: tierQuery.tier,
      extracted: result.text.split("\n").slice(0, 5),
      confidence: 0.8,
    });

    // 🔥 EARLY EXIT (90% case)
    break;
  }

  // 🔻 যদি সব tier fail হয়
  if (!finalText) {
    usedTier = "pure_model";

    finalText = [
      "No strong web result found.",
      "Using internal reasoning:",
      ...plan.pureModelFallback.slice(0, 3),
    ].join("\n");
  }

  return {
    ok: true,
    category: plan.category,
    mode: plan.mode,
    usedTier,
    normalizedQuery: plan.normalizedQuery,
    hits,
    extracts,
    finalText,
    citations: [],
    reason: "pro_search_executor_done",
  };
};
