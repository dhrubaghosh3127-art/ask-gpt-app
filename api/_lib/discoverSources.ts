// ASK-GPT Discover — Trusted Source List
// api/_lib/discoverSources.ts
// Only source definitions. No fetching, parsing, or caching here.

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscoverTab = 'foryou' | 'bangladesh';
export type DiscoverLanguage = 'en' | 'bn';
export type DiscoverRegion = 'global' | 'bangladesh';

export type DiscoverSource = {
  id: string;
  tab: DiscoverTab;
  label: string;
  feedUrl: string;
  language: DiscoverLanguage;
  region: DiscoverRegion;
  category: string;
  priority: number;
  trustScore: number;
};

// ── Google News RSS helper ────────────────────────────────────────────────────

function googleNewsSearch(
  query: string,
  options: { language: DiscoverLanguage; region: DiscoverRegion },
): string {
  if (options.language === 'bn') {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=bn&gl=BD&ceid=BD:bn`;
  }
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

// ── Source List ───────────────────────────────────────────────────────────────

export const DISCOVER_SOURCES: DiscoverSource[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // FOR YOU — Global English
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'foryou_world_reuters',
    tab: 'foryou',
    label: 'Reuters — World News',
    feedUrl: 'https://feeds.reuters.com/reuters/topNews',
    language: 'en',
    region: 'global',
    category: 'world',
    priority: 100,
    trustScore: 98,
  },
  {
    id: 'foryou_world_bbc',
    tab: 'foryou',
    label: 'BBC News — World',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    language: 'en',
    region: 'global',
    category: 'world',
    priority: 99,
    trustScore: 97,
  },
  {
    id: 'foryou_world_ap',
    tab: 'foryou',
    label: 'AP News — Top Stories',
    feedUrl: googleNewsSearch('site:apnews.com', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'world',
    priority: 98,
    trustScore: 97,
  },
  {
    id: 'foryou_tech_verge',
    tab: 'foryou',
    label: 'The Verge — Technology',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    language: 'en',
    region: 'global',
    category: 'technology',
    priority: 95,
    trustScore: 93,
  },
  {
    id: 'foryou_tech_techcrunch',
    tab: 'foryou',
    label: 'TechCrunch',
    feedUrl: 'https://techcrunch.com/feed/',
    language: 'en',
    region: 'global',
    category: 'technology',
    priority: 94,
    trustScore: 92,
  },
  {
    id: 'foryou_ai_wired',
    tab: 'foryou',
    label: 'Wired — AI & Science',
    feedUrl: 'https://www.wired.com/feed/rss',
    language: 'en',
    region: 'global',
    category: 'ai',
    priority: 93,
    trustScore: 91,
  },
  {
    id: 'foryou_ai_gnews',
    tab: 'foryou',
    label: 'Google News — Artificial Intelligence',
    feedUrl: googleNewsSearch('artificial intelligence AI OpenAI Google DeepMind', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'ai',
    priority: 92,
    trustScore: 88,
  },
  {
    id: 'foryou_business_bloomberg',
    tab: 'foryou',
    label: 'Bloomberg — Business',
    feedUrl: googleNewsSearch('site:bloomberg.com business economy', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'business',
    priority: 91,
    trustScore: 95,
  },
  {
    id: 'foryou_finance_cnbc',
    tab: 'foryou',
    label: 'CNBC — Markets & Finance',
    feedUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    language: 'en',
    region: 'global',
    category: 'finance',
    priority: 90,
    trustScore: 93,
  },
  {
    id: 'foryou_science_daily',
    tab: 'foryou',
    label: 'ScienceDaily — Top Science',
    feedUrl: 'https://www.sciencedaily.com/rss/top/science.xml',
    language: 'en',
    region: 'global',
    category: 'science',
    priority: 88,
    trustScore: 90,
  },
  {
    id: 'foryou_health_who',
    tab: 'foryou',
    label: 'Google News — Health & Medicine',
    feedUrl: googleNewsSearch('health medicine WHO CDC disease treatment', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'health',
    priority: 87,
    trustScore: 88,
  },
  {
    id: 'foryou_sports_espn',
    tab: 'foryou',
    label: 'ESPN — Sports',
    feedUrl: 'https://www.espn.com/espn/rss/news',
    language: 'en',
    region: 'global',
    category: 'sports',
    priority: 86,
    trustScore: 90,
  },
  {
    id: 'foryou_entertainment_variety',
    tab: 'foryou',
    label: 'Variety — Entertainment',
    feedUrl: 'https://variety.com/feed/',
    language: 'en',
    region: 'global',
    category: 'entertainment',
    priority: 84,
    trustScore: 87,
  },
  {
    id: 'foryou_culture_gnews',
    tab: 'foryou',
    label: 'Google News — Culture & Society',
    feedUrl: googleNewsSearch('culture society lifestyle trending stories', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'culture',
    priority: 82,
    trustScore: 82,
  },
  {
    id: 'foryou_climate_gnews',
    tab: 'foryou',
    label: 'Google News — Climate & Environment',
    feedUrl: googleNewsSearch('climate change environment nature sustainability', { language: 'en', region: 'global' }),
    language: 'en',
    region: 'global',
    category: 'science',
    priority: 80,
    trustScore: 85,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BANGLADESH — Bangla
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bd_national_prothomalo',
    tab: 'bangladesh',
    label: 'প্রথম আলো — জাতীয়',
    feedUrl: googleNewsSearch('প্রথম আলো বাংলাদেশ জাতীয় সংবাদ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'জাতীয়',
    priority: 100,
    trustScore: 97,
  },
  {
    id: 'bd_national_bdnews24',
    tab: 'bangladesh',
    label: 'বিডিনিউজ২৪ — শীর্ষ সংবাদ',
    feedUrl: googleNewsSearch('site:bangla.bdnews24.com বাংলাদেশ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'জাতীয়',
    priority: 99,
    trustScore: 96,
  },
  {
    id: 'bd_national_banglatribune',
    tab: 'bangladesh',
    label: 'বাংলা ট্রিবিউন — জাতীয়',
    feedUrl: googleNewsSearch('বাংলা ট্রিবিউন বাংলাদেশ সংবাদ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'জাতীয়',
    priority: 98,
    trustScore: 94,
  },
  {
    id: 'bd_politics_jugantor',
    tab: 'bangladesh',
    label: 'যুগান্তর — রাজনীতি',
    feedUrl: googleNewsSearch('যুগান্তর বাংলাদেশ রাজনীতি', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'রাজনীতি',
    priority: 95,
    trustScore: 91,
  },
  {
    id: 'bd_politics_samakal',
    tab: 'bangladesh',
    label: 'সমকাল — রাজনীতি ও জাতীয়',
    feedUrl: googleNewsSearch('সমকাল বাংলাদেশ রাজনীতি সরকার', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'রাজনীতি',
    priority: 94,
    trustScore: 90,
  },
  {
    id: 'bd_economy_kalerkantho',
    tab: 'bangladesh',
    label: 'কালের কণ্ঠ — অর্থনীতি',
    feedUrl: googleNewsSearch('কালের কণ্ঠ বাংলাদেশ অর্থনীতি ব্যবসা', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'অর্থনীতি',
    priority: 93,
    trustScore: 90,
  },
  {
    id: 'bd_economy_gnews',
    tab: 'bangladesh',
    label: 'Google News — বাংলাদেশ অর্থনীতি',
    feedUrl: googleNewsSearch('বাংলাদেশ অর্থনীতি বাজেট বিনিয়োগ শেয়ার বাজার', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'অর্থনীতি',
    priority: 92,
    trustScore: 87,
  },
  {
    id: 'bd_tech_gnews',
    tab: 'bangladesh',
    label: 'Google News — প্রযুক্তি ও ICT',
    feedUrl: googleNewsSearch('বাংলাদেশ প্রযুক্তি ICT ডিজিটাল স্টার্টআপ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'প্রযুক্তি',
    priority: 91,
    trustScore: 86,
  },
  {
    id: 'bd_sports_gnews',
    tab: 'bangladesh',
    label: 'Google News — বাংলাদেশ ক্রিকেট ও খেলা',
    feedUrl: googleNewsSearch('বাংলাদেশ ক্রিকেট ফুটবল খেলাধুলা', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'খেলা',
    priority: 90,
    trustScore: 88,
  },
  {
    id: 'bd_entertainment_gnews',
    tab: 'bangladesh',
    label: 'Google News — বিনোদন',
    feedUrl: googleNewsSearch('বাংলাদেশ বিনোদন চলচ্চিত্র নাটক সংগীত', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'বিনোদন',
    priority: 88,
    trustScore: 83,
  },
  {
    id: 'bd_health_gnews',
    tab: 'bangladesh',
    label: 'Google News — স্বাস্থ্য',
    feedUrl: googleNewsSearch('বাংলাদেশ স্বাস্থ্য হাসপাতাল রোগ চিকিৎসা', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'স্বাস্থ্য',
    priority: 87,
    trustScore: 85,
  },
  {
    id: 'bd_education_gnews',
    tab: 'bangladesh',
    label: 'Google News — শিক্ষা',
    feedUrl: googleNewsSearch('বাংলাদেশ শিক্ষা বিশ্ববিদ্যালয় এসএসসি এইচএসসি পরীক্ষা', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'শিক্ষা',
    priority: 86,
    trustScore: 86,
  },
  {
    id: 'bd_dhaka_gnews',
    tab: 'bangladesh',
    label: 'Google News — ঢাকা শহর',
    feedUrl: googleNewsSearch('ঢাকা শহর যানজট উন্নয়ন নগর', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'শহর',
    priority: 84,
    trustScore: 82,
  },
  {
    id: 'bd_ittefaq',
    tab: 'bangladesh',
    label: 'ইত্তেফাক — সর্বশেষ',
    feedUrl: googleNewsSearch('ইত্তেফাক বাংলাদেশ সর্বশেষ সংবাদ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'জাতীয়',
    priority: 83,
    trustScore: 88,
  },
  {
    id: 'bd_jamuna_tv',
    tab: 'bangladesh',
    label: 'যমুনা টিভি — সংবাদ',
    feedUrl: googleNewsSearch('যমুনা টিভি বাংলাদেশ সংবাদ', { language: 'bn', region: 'bangladesh' }),
    language: 'bn',
    region: 'bangladesh',
    category: 'জাতীয়',
    priority: 82,
    trustScore: 87,
  },
];

// ── Exported helper ───────────────────────────────────────────────────────────

export function getDiscoverSources(tab: DiscoverTab): DiscoverSource[] {
  return DISCOVER_SOURCES
    .filter((source) => source.tab === tab)
    .sort((a, b) => b.priority - a.priority || b.trustScore - a.trustScore);
  }
