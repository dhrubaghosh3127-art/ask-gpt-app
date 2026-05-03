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
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
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
  // Remove " - Source Name" suffix common in Google News
  const sourceSuffix = sourceLabel.split('—')[0].trim();
  clean = clean.replace(new RegExp(`\\s*[-–|]\\s*${escapeRegex(sourceSuffix)}\\s*$`, 'i'), '');
  // Generic suffix removal
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
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
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
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

// ── Image extraction ──────────────────────────────────────────────────────────

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (/\.(svg|gif)$/i.test(url)) return false;
  // Skip tiny tracking pixels (common patterns)
  if (/1x1|pixel|track|beacon/i.test(url)) return false;
  return true;
}

function extractImageFromItem(item: RssItem): string | null {
  // 1. RSS enclosure
  const encUrl = item.enclosure?.url;
  if (encUrl && isValidImageUrl(encUrl) && /image/i.test(item.enclosure?.type || 'image')) {
    return encUrl;
  }

  // 2. media:content
  const mediaContent = (item['media:content'] as { $?: { url?: string } } | undefined)?.$?.url;
  if (mediaContent && isValidImageUrl(mediaContent)) return mediaContent;

  // 3. media:thumbnail
  const mediaThumbnail = (item['media:thumbnail'] as { $?: { url?: string } } | undefined)?.$?.url;
  if (mediaThumbnail && isValidImageUrl(mediaThumbnail)) return mediaThumbnail;

  // 4. image inside content:encoded or content
  const contentEncoded = (item as Record<string, unknown>)['content:encoded'] as string | undefined;
  const raw = contentEncoded || item.content || '';
  if (raw) {
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1] && isValidImageUrl(match[1])) return match[1];
  }

  return null;
}

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ASK-GPT-Bot/1.0)' },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const html = await res.text();

    // og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1] && isValidImageUrl(ogMatch[1])) return ogMatch[1];

    // twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch?.[1] && isValidImageUrl(twMatch[1])) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

// ── Summary & bullets ─────────────────────────────────────────────────────────

function buildSummary(item: RssItem, language: 'en' | 'bn', title: string): string {
  const raw = cleanText(item.contentSnippet || item.summary || '');
  const maxLen = 180;

  if (raw.length > 10) {
    return raw.length > maxLen ? raw.slice(0, maxLen).replace(/\s+\S*$/, '') + '…' : raw;
  }

  // Fallback from title
  if (language === 'bn') {
    return `${title} সম্পর্কে সর্বশেষ তথ্য পাওয়া গেছে।`;
  }
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
        const items = (feed.items || []).slice(0, 8);

        for (const item of items) {
          const rawTitle = item.title || '';
          if (!rawTitle) continue;

          const headline = normalizeTitle(rawTitle, source.label);
          if (!headline) continue;

          const articleUrl = item.link || '';
          if (!articleUrl) continue;

          const publishedAt = item.isoDate || item.pubDate || '';
          const language = source.language;

          // Language validation
          if (language === 'bn') {
            if (!hasBanglaText(headline) && !hasBanglaText(item.contentSnippet || '')) continue;
          } else {
            if (!isMostlyEnglish(headline)) continue;
          }

          // Image extraction
          let image = extractImageFromItem(item) || null;
          if (!image && articleUrl) {
            image = await fetchOgImage(articleUrl);
          }
          // Skip item if no real image found
          if (!image) continue;

          const summary = buildSummary(item, language, headline);
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
