import { getDiscoverSources, type DiscoverTab } from "./_lib/discoverSources.js";
import { fetchDiscoverCardsFromSources } from "./_lib/discoverRss.js";

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

    const defaultLimit = tab === "bangladesh" ? 6 : 8;
    const limit = Number(req.query.limit || defaultLimit);

    // First safe test: only first 3 trusted sources.
    // Later final API will use all sources.
    const sources = getDiscoverSources(tab).slice(0, 3);

    const cards = await fetchDiscoverCardsFromSources(sources, tab, limit);

    return res.status(200).json({
      ok: true,
      mode: "live-test",
      tab,
      sourceCount: sources.length,
      cardCount: cards.length,
      cards,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to load live Discover test",
    });
  }
      }
