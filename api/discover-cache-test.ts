import type { DiscoverTab } from "./_lib/discoverSources.js";
import { getDiscoverFeedWithCache } from "./_lib/discoverCache.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const tabParam = String(req.query.tab || "foryou").toLowerCase();
    const tab: DiscoverTab = tabParam === "bangladesh" ? "bangladesh" : "foryou";

    const limit = tab === "bangladesh" ? 6 : 8;

    const result = await getDiscoverFeedWithCache({
      tab,
      limit,
      maxAgeMs: 15 * 60 * 1000,
      sourceLimit: 3,
    });

    return res.status(200).json({
      ok: true,
      mode: "cache-test",
      tab,
      limit,
      cardCount: result.cards.length,
      fromCache: result.fromCache,
      stale: result.stale,
      refreshed: result.refreshed,
      cacheAgeMs: result.cacheAgeMs,
      cards: result.cards,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to load Discover cache test",
    });
  }
      }
