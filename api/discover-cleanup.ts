import { supabaseAdmin } from './_lib/supabaseAdmin.js';

const CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;
const CARDS_TABLE = 'discover_cards';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false });
    return;
  }

  const cutoffMs = Date.now() - CACHE_RETENTION_MS;

  try {
    const { error: e1 } = await supabaseAdmin
      .from(CARDS_TABLE)
      .delete()
      .eq('tab', 'foryou')
      .lt('cached_at_ms', cutoffMs);

    const { error: e2 } = await supabaseAdmin
      .from(CARDS_TABLE)
      .delete()
      .eq('tab', 'bangladesh')
      .lt('cached_at_ms', cutoffMs);

    res.status(200).json({
      ok: true,
      cutoffMs,
      cutoffDate: new Date(cutoffMs).toISOString(),
      errors: [e1?.message, e2?.message].filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
      }
