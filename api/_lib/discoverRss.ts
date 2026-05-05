// ASK-GPT Discover — RSS Fetcher & Card Builder
// api/_lib/discoverRss.ts

import Parser from 'rss-parser';
import type { DiscoverSource, DiscoverTab } from './discoverSources.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscoverCard = {
  id: string;
  tab: 'foryou' | 'bangladesh';
  image: string;
  source: string;
  sourceAvatar: string;
  timeAgo: string;
  headline: string;
  summary: string;
  category: string;
  articleUrl: string;
  language: 'en' | 'bn';
  bullets: string[];
  publishedAt: string;
  fetchedAt: string;
  score: number;
};

// ── RSS Parser setup ──────────────────────────────────────────────────────────

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  summary?: string;
  content?: string;
  contentSnippet?: string;
  'content:encoded'?: string;
  enclosure?: { url?: string; type?: string };
  'media:content'?: unknown;
  'media:thumbnail'?: unknown;
};

const rssParser = new Parser<Record<string, unknown>, RssItem>({
  timeout: 8000,
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

const BOT_UA = 'Mozilla/5.0 (compatible; ASK-GPT-Bot/1.0; +https://ask-gpt-app.vercel.app)';

// ── Text helpers ──────────────────────────────────────────────────────────────

function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(title: string, sourceLabel: string): string {
  let clean = cleanText(title);
  const sourceSuffix = sourceLabel.split('—')[0].trim();
  clean = clean.replace(new RegExp(`\\s*[-–|]\\s*${escapeRegex(sourceSuffix)}\\s*$`, 'i'), '');
  clean = clean.replace(/\s*[-–|]\s*[A-Z][a-zA-Z\s]{2,30}$/, '');
  return clean.trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeId(url: string, tab: string): string {
  const hash = url.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return `${tab}_${Math.abs(hash).toString(36)}`;
}

function getTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function hasBanglaText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

function isMostlyEnglish(text: string): boolean {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  return total > 0 && latin / total > 0.5;
}

function getSourceAvatar(label: string): string {
  const name = encodeURIComponent(label.split('—')[0].trim().slice(0, 20));
  return `https://ui-avatars.com/api/?name=${name}&background=0d9488&color=ffffff&size=64`;
}

function normalizeUrl(url: string): string {
  try { return new URL(url).href; } catch { return url; }
}

// ── Image validation ──────────────────────────────────────────────────────────

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (/\.(svg|gif|ico)$/i.test(url)) return false;
  if (/1x1|pixel|track|beacon|transparent/i.test(url)) return false;
  if (/[_\-](1x1|16x16|32x32|64x64|80x80)/i.test(url)) return false;
  if (/logo|favicon|\/icon[/_\-]|sprite|placeholder|default[-_]?img|avatar|profile[-_]?img/i.test(url)) return false;
  if (/news\.google\.com\/api\/attachments/i.test(url)) return false;
  if (/encrypted-tbn\d\.gstatic\.com/i.test(url)) return false;
  if (/[?&](w|width)=(80|100|120|150)(&|$)/i.test(url)) return false;
  return true;
}

function scoreImageUrl(url: string): number {
  let score = 50;
  const wMatch = url.match(/[?&](?:w|width)=(\d+)/i);
  if (wMatch) {
    const w = parseInt(wMatch[1], 10);
    if (w >= 1200) score += 40;
    else if (w >= 800) score += 30;
    else if (w >= 600) score += 20;
    else if (w >= 400) score += 10;
    else if (w < 200) score -= 30;
  }
  if (/cloudfront|akamai|fastly|cdn\.|images\.|media\./i.test(url)) score += 10;
  return score;
}

function pickBestImage(candidates: (string | null | undefined)[]): string | null {
  const valid = candidates.filter((u): u is string => !!u && isValidImageUrl(u));
  if (valid.length === 0) return null;
  return valid.sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a))[0];
}

// ── Google News redirect resolver ────────────────────────────────────────────

function isGoogleNewsUrl(url: string): boolean {
  return /news\.google\.com/i.test(url);
}

async function resolveGoogleNewsUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': BOT_UA },
      redirect: 'follow',
    });
    clearTimeout(timer);
    const final = res.url;
    return final && !isGoogleNewsUrl(final) ? final : url;
  } catch {
    return url;
  }
}

// ── Article page og:image fetch ───────────────────────────────────────────────

async function fetchArticleMetaImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': BOT_UA, 'Accept': 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    // Read only first 40KB
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = '';
    let bytes = 0;
    while (bytes < 40000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value?.length ?? 0;
    }
    reader.cancel().catch(() => {});

    const candidates: (string | null)[] = [];

    // og:image
    candidates.push(
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
      null
    );

    // og:image:secure_url
    candidates.push(
      html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i)?.[1] ||
      null
    );

    // twitter:image
    candidates.push(
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)?.[1] ||
      null
    );

    // twitter:image:src
    candidates.push(
      html.match(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      null
    );

    // link rel="image_src"
    candidates.push(
      html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i)?.[1] ||
      null
    );

    // JSON-LD image
    candidates.push(
      html.match(/"image"\s*:\s*"(https[^"]+)"/)?.[1] ||
      html.match(/"image"\s*:\s*\{\s*"url"\s*:\s*"(https[^"]+)"/)?.[1] ||
      null
    );

    return pickBestImage(candidates);
  } catch {
    return null;
  }
}

// ── RSS image extraction ──────────────────────────────────────────────────────

function readMediaUrl(raw: unknown): string | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const url = (entry as { $?: { url?: string } })?.$?.url;
      if (url && isValidImageUrl(url)) return url;
    }
    return null;
  }
  const url = (raw as { $?: { url?: string } })?.$?.url;
  return url && isValidImageUrl(url) ? url : null;
}

function extractImageFromItem(item: RssItem): string | null {
  const candidates: (string | null)[] = [];

  const encUrl = item.enclosure?.url;
  if (encUrl && /image/i.test(item.enclosure?.type || 'image')) candidates.push(encUrl);

  candidates.push(readMediaUrl((item as Record<string, unknown>)['media:content']));
  candidates.push(readMediaUrl((item as Record<string, unknown>)['media:thumbnail']));

  const contentEncoded = (item as Record<string, unknown>)['content:encoded'] as string | undefined;
  const raw = contentEncoded || item.content || item.summary || '';
  if (raw) {
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) candidates.push(match[1]);
  }

  return pickBestImage(candidates);
}

// ── Spam / promo blocklist ────────────────────────────────────────────────────

const SPAM_TERMS_EN = [
  'coupon', 'promo', 'promo code', 'discount', 'deal', 'deals', 'sale',
  'offer', 'voucher', 'cashback', 'limited time', 'save money', 'turbotax',
  'referral code', 'shopping code', 'affiliate', 'best buy deal', 'amazon deal',
];

const SPAM_TERMS_BN = [
  'কুপন', 'প্রোমো', 'ডিসকাউন্ট', 'ছাড়', 'অফার', 'ক্যাশব্যাক', 'ভাউচার',
];

function isSpam(headline: string, summary: string, url: string, language: 'en' | 'bn'): boolean {
  const combined = `${headline} ${summary} ${url}`.toLowerCase();
  const terms = language === 'bn' ? SPAM_TERMS_BN : SPAM_TERMS_EN;
  return terms.some(t => combined.includes(t.toLowerCase()));
}

// ── Summary & bullets ─────────────────────────────────────────────────────────

function buildSummary(item: RssItem, language: 'en' | 'bn', title: string): string {
  const raw = cleanText(item.contentSnippet || item.summary || '');
  const maxLen = 180;
  if (raw.length > 10) {
    return raw.length > maxLen ? raw.slice(0, maxLen).replace(/\s+\S*$/, '') + '…' : raw;
  }
  if (language === 'bn') return `${title} সম্পর্কে সর্বশেষ তথ্য পাওয়া গেছে।`;
  return `Latest updates on: ${title.slice(0, 120)}.`;
}

function buildBullets(item: RssItem, language: 'en' | 'bn', title: string, source: string): string[] {
  const snippet = cleanText(item.contentSnippet || item.summary || '');
  if (language === 'bn') {
    return [
      snippet.length > 20
        ? snippet.slice(0, 120).replace(/\s+\S*$/, '') + (snippet.length > 120 ? '…' : '')
        : `${title.slice(0, 80)} বিষয়ে নতুন তথ্য প্রকাশিত হয়েছে।`,
      `${source} এই বিষয়ে বিস্তারিত তথ্য প্রকাশ করেছে।`,
      'বিস্তারিত জানতে সম্পূর্ণ প্রতিবেদনটি পড়ুন।',
    ];
  }
  return [
    snippet.length > 20
      ? snippet.slice(0, 140).replace(/\s+\S*$/, '') + (snippet.length > 140 ? '…' : '')
      : `${title.slice(0, 100)} — new developments reported.`,
    `${source} reported on this story with further context and background.`,
    'Follow the full article for complete details and expert analysis.',
  ];
}

// ── Score calculator ──────────────────────────────────────────────────────────

function calcScore(source: DiscoverSource, publishedAt: string, hasImage: boolean, hasSummary: boolean): number {
  let score = source.priority * 0.6 + source.trustScore * 0.4;
  if (publishedAt) {
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
    if (ageHours < 2) score += 12;
    else if (ageHours < 6) score += 8;
    else if (ageHours < 12) score += 4;
    else if (ageHours < 24) score += 2;
  }
  if (hasImage) score += 8;
  if (hasSummary) score += 3;
  return Math.round(score * 10) / 10;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function normalizeHeadline(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '').slice(0, 60);
}

function deduplicateCards(cards: DiscoverCard[]): DiscoverCard[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  return cards.filter(card => {
    const urlKey = normalizeUrl(card.articleUrl);
    const titleKey = normalizeHeadline(card.headline);
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) return false;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    return true;
  });
}

// ── Main fetch function ───────────────────────────────────────────────────────

export async function fetchDiscoverCardsFromSources(
  sources: DiscoverSource[],
  tab: DiscoverTab,
  limit = 20,
): Promise<DiscoverCard[]> {
  const fetchedAt = new Date().toISOString();
  const allCards: DiscoverCard[] = [];

  await Promise.allSettled(
    sources.map(async (source) => {
      try {
        const feed = await rssParser.parseURL(source.feedUrl);
        const items = (feed.items || []).slice(0, 4);

        for (const item of items) {
          const rawTitle = item.title || '';
          if (!rawTitle) continue;

          const headline = normalizeTitle(rawTitle, source.label);
          if (!headline) continue;

          const rawLink = item.link || '';
          if (!rawLink) continue;

          // Step 1: Resolve Google News redirect → real publisher URL
          const articleUrl = isGoogleNewsUrl(rawLink)
            ? await resolveGoogleNewsUrl(rawLink)
            : rawLink;

          const publishedAt = item.isoDate || item.pubDate || '';
          const language = source.language;

          // Language validation
          if (language === 'bn') {
            if (!hasBanglaText(headline) && !hasBanglaText(item.contentSnippet || '')) continue;
          } else {
            if (!isMostlyEnglish(headline)) continue;
          }

          // Step 2: og:image from article page (best quality)
          const ogImage = await fetchArticleMetaImage(articleUrl);

          // Step 3: RSS image as fallback
          const rssImage = extractImageFromItem(item);

          // Step 4: Pick best — og:image wins
          const image = pickBestImage([ogImage, rssImage]);

          // Skip if no real quality image
          if (!image) continue;

          const summary = buildSummary(item, language, headline);

          // Spam filter
          if (isSpam(headline, summary, articleUrl, language)) continue;

          const bullets = buildBullets(item, language, headline, source.label.split('—')[0].trim());
          const score = calcScore(source, publishedAt, true, summary.length > 20);

          allCards.push({
            id: makeId(articleUrl, tab),
            tab,
            image,
            source: source.label.split('—')[0].trim(),
            sourceAvatar: getSourceAvatar(source.label),
            timeAgo: getTimeAgo(publishedAt || fetchedAt),
            headline,
            summary,
            category: source.category,
            articleUrl: normalizeUrl(articleUrl),
            language,
            bullets,
            publishedAt: publishedAt || fetchedAt,
            fetchedAt,
            score,
          });
        }
      } catch {
        // Skip broken source silently
      }
    }),
  );

  const deduplicated = deduplicateCards(allCards);

  return deduplicated
    .sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
  
