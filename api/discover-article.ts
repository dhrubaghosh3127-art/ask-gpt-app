// ASK-GPT Discover — Article Detail API
// api/discover-article.ts

import { getCachedDiscoverCardById } from './_lib/discoverCache.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const id = typeof req.query?.id === 'string' ? req.query.id.trim() : '';

  if (!id) {
    res.status(400).json({ ok: false, error: 'Missing id parameter' });
    return;
  }

  try {
    const card = await getCachedDiscoverCardById(id);

    if (!card) {
      res.status(404).json({ ok: false, error: 'Article not found' });
      return;
    }

    res.status(200).json({ ok: true, article: card });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
}
