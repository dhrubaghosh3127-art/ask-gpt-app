import type {
  ProSearchCategory,
  ProSearchMode,
  ProSearchTier,
  ProSearchTierQuery,
} from "./types.js";
import { CONTROLLER_V2_MODELS } from "../controllerV2.js";
import { callControllerV2Model } from "../controllerV2Api.js";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
} from "../controllerV2Runtime.js";

export interface ProSearchTierSearchResult {
  ok: boolean;
  model: string;
  tier: ProSearchTier;
  text: string;
  reason?: string;
}

const HEAVY_CATEGORIES: ProSearchCategory[] = [
  "math",
  "code",
  "health",
  "facts",
];

const isHeavyCategory = (category: ProSearchCategory): boolean => {
  return HEAVY_CATEGORIES.includes(category);
};

const pickProSearchModel = ({
  category,
  mode,
  tier,
}: {
  category: ProSearchCategory;
  mode: ProSearchMode;
  tier: ProSearchTier;
}): string => {
  if (mode === "fast") {
    return CONTROLLER_V2_MODELS.webSupport;
  }

  if (tier === "primary") {
    return CONTROLLER_V2_MODELS.webSupport;
  }

  if (tier === "secondary") {
    return isHeavyCategory(category)
      ? CONTROLLER_V2_MODELS.webMain
      : CONTROLLER_V2_MODELS.webSupport;
  }

  return isHeavyCategory(category)
    ? CONTROLLER_V2_MODELS.webMain
    : CONTROLLER_V2_MODELS.webSupport;
};

const getTierMaxTokens = ({
  category,
  mode,
  tier,
}: {
  category: ProSearchCategory;
  mode: ProSearchMode;
  tier: ProSearchTier;
}): number => {
  if (mode === "fast") return 320;
  if (tier === "primary") return 420;

  if (tier === "secondary") {
    return isHeavyCategory(category) ? 700 : 520;
  }

  return isHeavyCategory(category) ? 1100 : 700;
};

const isNoResultText = (text: string): boolean => {
  const t = String(text || "").trim().toLowerCase();
  return !t || t === "no_result" || t === "no result";
};

const buildTierSearchPrompt = ({
  normalizedQuery,
  tierQuery,
  mode,
}: {
  normalizedQuery: string;
  tierQuery: ProSearchTierQuery;
  mode: ProSearchMode;
}): string => {
  return [
    "Search the web and return only useful findings.",
    `User query: ${normalizedQuery}`,
    `Tier: ${tierQuery.tier}`,
    `Allowed domains: ${
      tierQuery.domains.length ? tierQuery.domains.join(", ") : "general web"
    }`,
    `Search query: ${tierQuery.query}`,
    "",
    "Rules:",
    "- Prefer allowed domains first.",
    "- Keep only useful findings.",
    "- Do not copy full pages.",
    "- Do not add code fences.",
    "- If nothing useful is found, return exactly: NO_RESULT",
    mode === "fast"
      ? "- Keep the answer compact."
      : "- Return concise but enough findings for later extraction.",
    "",
    "Format:",
    "1. Source - useful finding",
    "2. Source - useful finding",
    "3. Source - useful finding",
    "4. Source - useful finding",
    "5. Source - useful finding",
  ].join("\n");
};

export const runProSearchTier = async ({
  apiKey,
  category,
  normalizedQuery,
  tierQuery,
  mode,
}: {
  apiKey: string;
  category: ProSearchCategory;
  normalizedQuery: string;
  tierQuery: ProSearchTierQuery;
  mode: ProSearchMode;
}): Promise<ProSearchTierSearchResult> => {
  const model = pickProSearchModel({
    category,
    mode,
    tier: tierQuery.tier,
  });

  const response = await callControllerV2Model({
    apiKey,
    model,
    messages: [
      {
        role: "user",
        content: buildTierSearchPrompt({
          normalizedQuery,
          tierQuery,
          mode,
        }),
      },
    ],
    temperature: 0,
    maxCompletionTokens: getTierMaxTokens({
      category,
      mode,
      tier: tierQuery.tier,
    }),
    reasoningEffort: "low",
  });

  if (!response.ok) {
    return {
      ok: false,
      model,
      tier: tierQuery.tier,
      text: "",
      reason: response.error || "pro_search_tier_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data).trim();

  if (isControllerV2Empty(text) || isNoResultText(text)) {
    return {
      ok: false,
      model,
      tier: tierQuery.tier,
      text: "",
      reason: "no_result",
    };
  }

  return {
    ok: true,
    model,
    tier: tierQuery.tier,
    text,
  };
};
