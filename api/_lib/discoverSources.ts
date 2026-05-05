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

const EN = { language: 'en' as DiscoverLanguage, region: 'global' as DiscoverRegion };
const BD = { language: 'bn' as DiscoverLanguage, region: 'bangladesh' as DiscoverRegion };

// ── Source List ───────────────────────────────────────────────────────────────

export const DISCOVER_SOURCES: DiscoverSource[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // FOR YOU — Global English (35 sources)
  // ══════════════════════════════════════════════════════════════════════════

  // World / Top News
  {
    id: 'fy_world_reuters',
    tab: 'foryou', label: 'Reuters — World News',
    feedUrl: 'https://feeds.reuters.com/reuters/topNews',
    language: 'en', region: 'global', category: 'world', priority: 100, trustScore: 98,
  },
  {
    id: 'fy_world_bbc',
    tab: 'foryou', label: 'BBC News — World',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    language: 'en', region: 'global', category: 'world', priority: 99, trustScore: 97,
  },
  {
    id: 'fy_world_ap',
    tab: 'foryou', label: 'AP News — Top Stories',
    feedUrl: googleNewsSearch('site:apnews.com', EN),
    language: 'en', region: 'global', category: 'world', priority: 98, trustScore: 97,
  },
  {
    id: 'fy_world_guardian',
    tab: 'foryou', label: 'The Guardian — World',
    feedUrl: 'https://www.theguardian.com/world/rss',
    language: 'en', region: 'global', category: 'world', priority: 97, trustScore: 95,
  },
  {
    id: 'fy_world_aljazeera',
    tab: 'foryou', label: 'Al Jazeera English',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    language: 'en', region: 'global', category: 'world', priority: 96, trustScore: 93,
  },
  {
    id: 'fy_world_npr',
    tab: 'foryou', label: 'NPR — Top Stories',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    language: 'en', region: 'global', category: 'world', priority: 95, trustScore: 94,
  },
  {
    id: 'fy_world_cnn',
    tab: 'foryou', label: 'CNN — Top Stories',
    feedUrl: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    language: 'en', region: 'global', category: 'world', priority: 94, trustScore: 91,
  },
  {
    id: 'fy_world_gnews_trending',
    tab: 'foryou', label: 'Google News — Top World Stories',
    feedUrl: googleNewsSearch('world news top stories breaking today', EN),
    language: 'en', region: 'global', category: 'world', priority: 93, trustScore: 87,
  },

  // Technology
  {
    id: 'fy_tech_verge',
    tab: 'foryou', label: 'The Verge — Technology',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    language: 'en', region: 'global', category: 'technology', priority: 92, trustScore: 93,
  },
  {
    id: 'fy_tech_techcrunch',
    tab: 'foryou', label: 'TechCrunch',
    feedUrl: 'https://techcrunch.com/feed/',
    language: 'en', region: 'global', category: 'technology', priority: 91, trustScore: 92,
  },
  {
    id: 'fy_tech_ars',
    tab: 'foryou', label: 'Ars Technica',
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    language: 'en', region: 'global', category: 'technology', priority: 90, trustScore: 91,
  },
  {
    id: 'fy_tech_wired',
    tab: 'foryou', label: 'Wired — Technology',
    feedUrl: 'https://www.wired.com/feed/rss',
    language: 'en', region: 'global', category: 'technology', priority: 89, trustScore: 91,
  },

  // AI
  {
    id: 'fy_ai_gnews',
    tab: 'foryou', label: 'Google News — AI & Machine Learning',
    feedUrl: googleNewsSearch('artificial intelligence AI OpenAI Google DeepMind Anthropic LLM', EN),
    language: 'en', region: 'global', category: 'ai', priority: 88, trustScore: 88,
  },
  {
    id: 'fy_ai_mit',
    tab: 'foryou', label: 'MIT Tech Review — AI',
    feedUrl: googleNewsSearch('site:technologyreview.com artificial intelligence', EN),
    language: 'en', region: 'global', category: 'ai', priority: 87, trustScore: 93,
  },

  // Startups
  {
    id: 'fy_startup_gnews',
    tab: 'foryou', label: 'Google News — Startups & Venture',
    feedUrl: googleNewsSearch('startup funding venture capital Series A unicorn IPO', EN),
    language: 'en', region: 'global', category: 'startups', priority: 86, trustScore: 86,
  },

  // Business / Economy
  {
    id: 'fy_business_bloomberg',
    tab: 'foryou', label: 'Bloomberg — Business',
    feedUrl: googleNewsSearch('site:bloomberg.com business economy markets', EN),
    language: 'en', region: 'global', category: 'business', priority: 85, trustScore: 95,
  },
  {
    id: 'fy_business_gnews',
    tab: 'foryou', label: 'Google News — Global Economy',
    feedUrl: googleNewsSearch('global economy recession trade policy GDP inflation', EN),
    language: 'en', region: 'global', category: 'business', priority: 84, trustScore: 86,
  },

  // Finance / Markets
  {
    id: 'fy_finance_cnbc',
    tab: 'foryou', label: 'CNBC — Markets & Finance',
    feedUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    language: 'en', region: 'global', category: 'finance', priority: 83, trustScore: 93,
  },
  {
    id: 'fy_finance_gnews',
    tab: 'foryou', label: 'Google News — Stock Markets',
    feedUrl: googleNewsSearch('stock market S&P 500 Wall Street Fed interest rates crypto', EN),
    language: 'en', region: 'global', category: 'finance', priority: 82, trustScore: 87,
  },

  // Science
  {
    id: 'fy_science_daily',
    tab: 'foryou', label: 'ScienceDaily — Top Science',
    feedUrl: 'https://www.sciencedaily.com/rss/top/science.xml',
    language: 'en', region: 'global', category: 'science', priority: 81, trustScore: 90,
  },
  {
    id: 'fy_science_nature',
    tab: 'foryou', label: 'Google News — Nature & Research',
    feedUrl: googleNewsSearch('scientific research breakthrough discovery Nature Science journal', EN),
    language: 'en', region: 'global', category: 'science', priority: 80, trustScore: 91,
  },
  {
    id: 'fy_science_space',
    tab: 'foryou', label: 'Google News — Space & NASA',
    feedUrl: googleNewsSearch('NASA SpaceX space exploration Mars moon asteroid', EN),
    language: 'en', region: 'global', category: 'science', priority: 79, trustScore: 88,
  },

  // Health
  {
    id: 'fy_health_gnews',
    tab: 'foryou', label: 'Google News — Health & Medicine',
    feedUrl: googleNewsSearch('health medicine WHO CDC disease treatment vaccine', EN),
    language: 'en', region: 'global', category: 'health', priority: 78, trustScore: 88,
  },
  {
    id: 'fy_health_bbc',
    tab: 'foryou', label: 'BBC News — Health',
    feedUrl: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    language: 'en', region: 'global', category: 'health', priority: 77, trustScore: 94,
  },

  // Climate / Environment
  {
    id: 'fy_climate_gnews',
    tab: 'foryou', label: 'Google News — Climate & Environment',
    feedUrl: googleNewsSearch('climate change environment nature sustainability emissions', EN),
    language: 'en', region: 'global', category: 'climate', priority: 76, trustScore: 85,
  },
  {
    id: 'fy_climate_guardian',
    tab: 'foryou', label: 'The Guardian — Environment',
    feedUrl: 'https://www.theguardian.com/environment/rss',
    language: 'en', region: 'global', category: 'climate', priority: 75, trustScore: 90,
  },

  // Sports
  {
    id: 'fy_sports_espn',
    tab: 'foryou', label: 'ESPN — Sports',
    feedUrl: 'https://www.espn.com/espn/rss/news',
    language: 'en', region: 'global', category: 'sports', priority: 74, trustScore: 90,
  },
  {
    id: 'fy_sports_bbc',
    tab: 'foryou', label: 'BBC Sport',
    feedUrl: 'https://feeds.bbci.co.uk/sport/rss.xml',
    language: 'en', region: 'global', category: 'sports', priority: 73, trustScore: 92,
  },
  {
    id: 'fy_sports_football',
    tab: 'foryou', label: 'Google News — Football & Cricket',
    feedUrl: googleNewsSearch('football Premier League Champions League cricket ICC Test', EN),
    language: 'en', region: 'global', category: 'sports', priority: 72, trustScore: 87,
  },

  // Entertainment
  {
    id: 'fy_ent_variety',
    tab: 'foryou', label: 'Variety — Entertainment',
    feedUrl: 'https://variety.com/feed/',
    language: 'en', region: 'global', category: 'entertainment', priority: 71, trustScore: 87,
  },
  {
    id: 'fy_ent_hollywood',
    tab: 'foryou', label: 'Hollywood Reporter',
    feedUrl: googleNewsSearch('site:hollywoodreporter.com movies TV streaming', EN),
    language: 'en', region: 'global', category: 'entertainment', priority: 70, trustScore: 86,
  },
  {
    id: 'fy_ent_streaming',
    tab: 'foryou', label: 'Google News — Netflix & Streaming',
    feedUrl: googleNewsSearch('Netflix Disney Plus HBO Max streaming new release trailer', EN),
    language: 'en', region: 'global', category: 'entertainment', priority: 69, trustScore: 84,
  },

  // Culture / Lifestyle
  {
    id: 'fy_culture_gnews',
    tab: 'foryou', label: 'Google News — Culture & Society',
    feedUrl: googleNewsSearch('culture society lifestyle viral trending interesting story', EN),
    language: 'en', region: 'global', category: 'culture', priority: 68, trustScore: 82,
  },
  {
    id: 'fy_politics_gnews',
    tab: 'foryou', label: 'Google News — Global Politics',
    feedUrl: googleNewsSearch('US politics Congress White House Europe elections global politics', EN),
    language: 'en', region: 'global', category: 'politics', priority: 67, trustScore: 85,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BANGLADESH — Bangla (45 sources)
  // ══════════════════════════════════════════════════════════════════════════

  // জাতীয় / সর্বশেষ — Top national sources
  {
    id: 'bd_prothomalo',
    tab: 'bangladesh', label: 'প্রথম আলো — জাতীয়',
    feedUrl: googleNewsSearch('প্রথম আলো বাংলাদেশ জাতীয় সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 100, trustScore: 97,
  },
  {
    id: 'bd_bdnews24',
    tab: 'bangladesh', label: 'বিডিনিউজ২৪ — শীর্ষ সংবাদ',
    feedUrl: googleNewsSearch('বিডিনিউজ২৪ বাংলাদেশ সর্বশেষ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 99, trustScore: 96,
  },
  {
    id: 'bd_banglatribune',
    tab: 'bangladesh', label: 'বাংলা ট্রিবিউন — জাতীয়',
    feedUrl: googleNewsSearch('বাংলা ট্রিবিউন বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 98, trustScore: 94,
  },
  {
    id: 'bd_samakal',
    tab: 'bangladesh', label: 'সমকাল — সর্বশেষ',
    feedUrl: googleNewsSearch('সমকাল বাংলাদেশ সর্বশেষ খবর', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 97, trustScore: 92,
  },
  {
    id: 'bd_jugantor',
    tab: 'bangladesh', label: 'যুগান্তর — জাতীয়',
    feedUrl: googleNewsSearch('যুগান্তর বাংলাদেশ জাতীয় সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 96, trustScore: 91,
  },
  {
    id: 'bd_kalerkantho',
    tab: 'bangladesh', label: 'কালের কণ্ঠ — সর্বশেষ',
    feedUrl: googleNewsSearch('কালের কণ্ঠ বাংলাদেশ সর্বশেষ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 95, trustScore: 91,
  },
  {
    id: 'bd_ittefaq',
    tab: 'bangladesh', label: 'ইত্তেফাক — সর্বশেষ',
    feedUrl: googleNewsSearch('ইত্তেফাক বাংলাদেশ সর্বশেষ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 94, trustScore: 90,
  },
  {
    id: 'bd_jagonews',
    tab: 'bangladesh', label: 'জাগো নিউজ — জাতীয়',
    feedUrl: googleNewsSearch('জাগো নিউজ বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 93, trustScore: 89,
  },
  {
    id: 'bd_dhakapost',
    tab: 'bangladesh', label: 'ঢাকা পোস্ট — জাতীয়',
    feedUrl: googleNewsSearch('ঢাকা পোস্ট বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 92, trustScore: 88,
  },
  {
    id: 'bd_bdpratidin',
    tab: 'bangladesh', label: 'বাংলাদেশ প্রতিদিন',
    feedUrl: googleNewsSearch('বাংলাদেশ প্রতিদিন সংবাদ জাতীয়', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 91, trustScore: 88,
  },
  {
    id: 'bd_banglanews24',
    tab: 'bangladesh', label: 'বাংলানিউজ২৪',
    feedUrl: googleNewsSearch('বাংলানিউজ২৪ বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 90, trustScore: 87,
  },
  {
    id: 'bd_manabzamin',
    tab: 'bangladesh', label: 'মানবজমিন — জাতীয়',
    feedUrl: googleNewsSearch('মানবজমিন বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 89, trustScore: 87,
  },
  {
    id: 'bd_desherupantar',
    tab: 'bangladesh', label: 'দেশ রূপান্তর',
    feedUrl: googleNewsSearch('দেশ রূপান্তর বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 88, trustScore: 86,
  },
  {
    id: 'bd_amarkholshi',
    tab: 'bangladesh', label: 'আমাদের সময়',
    feedUrl: googleNewsSearch('আমাদের সময় বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 87, trustScore: 85,
  },
  {
    id: 'bd_ajkerpotrika',
    tab: 'bangladesh', label: 'আজকের পত্রিকা',
    feedUrl: googleNewsSearch('আজকের পত্রিকা বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 86, trustScore: 85,
  },
  {
    id: 'bd_nayaDiganta',
    tab: 'bangladesh', label: 'নয়া দিগন্ত',
    feedUrl: googleNewsSearch('নয়া দিগন্ত বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 85, trustScore: 84,
  },

  // টেলিভিশন সংবাদ
  {
    id: 'bd_jamuna_tv',
    tab: 'bangladesh', label: 'যমুনা টিভি — সংবাদ',
    feedUrl: googleNewsSearch('যমুনা টিভি বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 84, trustScore: 88,
  },
  {
    id: 'bd_somoy_tv',
    tab: 'bangladesh', label: 'সময় সংবাদ',
    feedUrl: googleNewsSearch('সময় টিভি সময় সংবাদ বাংলাদেশ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 83, trustScore: 87,
  },
  {
    id: 'bd_ntv',
    tab: 'bangladesh', label: 'এনটিভি বাংলাদেশ',
    feedUrl: googleNewsSearch('এনটিভি NTV বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 82, trustScore: 87,
  },
  {
    id: 'bd_rtv',
    tab: 'bangladesh', label: 'আরটিভি সংবাদ',
    feedUrl: googleNewsSearch('আরটিভি RTV বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 81, trustScore: 86,
  },
  {
    id: 'bd_channel24',
    tab: 'bangladesh', label: 'চ্যানেল ২৪',
    feedUrl: googleNewsSearch('চ্যানেল ২৪ Channel 24 বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 80, trustScore: 86,
  },
  {
    id: 'bd_ekattor',
    tab: 'bangladesh', label: 'একাত্তর টিভি',
    feedUrl: googleNewsSearch('একাত্তর টিভি Ekattor বাংলাদেশ সংবাদ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 79, trustScore: 87,
  },
  {
    id: 'bd_independent_tv',
    tab: 'bangladesh', label: 'ইনডিপেন্ডেন্ট টিভি',
    feedUrl: googleNewsSearch('ইনডিপেন্ডেন্ট টিভি Independent TV বাংলাদেশ', BD),
    language: 'bn', region: 'bangladesh', category: 'জাতীয়', priority: 78, trustScore: 85,
  },

  // রাজনীতি
  {
    id: 'bd_politics_gnews',
    tab: 'bangladesh', label: 'Google News — বাংলাদেশ রাজনীতি',
    feedUrl: googleNewsSearch('বাংলাদেশ রাজনীতি সরকার আওয়ামী লীগ বিএনপি জাতীয় পার্টি', BD),
    language: 'bn', region: 'bangladesh', category: 'রাজনীতি', priority: 77, trustScore: 87,
  },
  {
    id: 'bd_politics2_gnews',
    tab: 'bangladesh', label: 'Google News — নির্বাচন ও সংসদ',
    feedUrl: googleNewsSearch('বাংলাদেশ নির্বাচন সংসদ জাতীয় সংসদ ভোট', BD),
    language: 'bn', region: 'bangladesh', category: 'রাজনীতি', priority: 76, trustScore: 85,
  },

  // অর্থনীতি
  {
    id: 'bd_economy_gnews',
    tab: 'bangladesh', label: 'Google News — বাংলাদেশ অর্থনীতি',
    feedUrl: googleNewsSearch('বাংলাদেশ অর্থনীতি বাজেট বিনিয়োগ রপ্তানি আমদানি', BD),
    language: 'bn', region: 'bangladesh', category: 'অর্থনীতি', priority: 75, trustScore: 87,
  },
  {
    id: 'bd_sheyerbazar',
    tab: 'bangladesh', label: 'Google News — শেয়ার বাজার',
    feedUrl: googleNewsSearch('বাংলাদেশ শেয়ার বাজার ডিএসই সিএসই বিনিয়োগকারী', BD),
    language: 'bn', region: 'bangladesh', category: 'অর্থনীতি', priority: 74, trustScore: 85,
  },
  {
    id: 'bd_remittance',
    tab: 'bangladesh', label: 'Google News — রেমিট্যান্স ও ব্যাংক',
    feedUrl: googleNewsSearch('বাংলাদেশ রেমিট্যান্স ব্যাংক টাকা বৈদেশিক মুদ্রা', BD),
    language: 'bn', region: 'bangladesh', category: 'অর্থনীতি', priority: 73, trustScore: 84,
  },

  // প্রযুক্তি / ICT
  {
    id: 'bd_tech_gnews',
    tab: 'bangladesh', label: 'Google News — বাংলাদেশ প্রযুক্তি',
    feedUrl: googleNewsSearch('বাংলাদেশ প্রযুক্তি ICT ডিজিটাল স্টার্টআপ AI', BD),
    language: 'bn', region: 'bangladesh', category: 'প্রযুক্তি', priority: 72, trustScore: 86,
  },
  {
    id: 'bd_internet_gnews',
    tab: 'bangladesh', label: 'Google News — ইন্টারনেট ও মোবাইল',
    feedUrl: googleNewsSearch('বাংলাদেশ ইন্টারনেট মোবাইল অ্যাপ স্মার্টফোন', BD),
    language: 'bn', region: 'bangladesh', category: 'প্রযুক্তি', priority: 71, trustScore: 84,
  },

  // খেলা / ক্রিকেট
  {
    id: 'bd_cricket_gnews',
    tab: 'bangladesh', label: 'Google News — বাংলাদেশ ক্রিকেট',
    feedUrl: googleNewsSearch('বাংলাদেশ ক্রিকেট টাইগার্স ICC টেস্ট ওয়ানডে T20', BD),
    language: 'bn', region: 'bangladesh', category: 'খেলা', priority: 70, trustScore: 89,
  },
  {
    id: 'bd_football_gnews',
    tab: 'bangladesh', label: 'Google News — বাংলাদেশ ফুটবল',
    feedUrl: googleNewsSearch('বাংলাদেশ ফুটবল সাফ বিশ্বকাপ বাফুফে', BD),
    language: 'bn', region: 'bangladesh', category: 'খেলা', priority: 69, trustScore: 86,
  },
  {
    id: 'bd_sports_gnews',
    tab: 'bangladesh', label: 'Google News — সব খেলা',
    feedUrl: googleNewsSearch('বাংলাদেশ খেলাধুলা অ্যাথলেটিক্স অলিম্পিক', BD),
    language: 'bn', region: 'bangladesh', category: 'খেলা', priority: 68, trustScore: 85,
  },

  // বিনোদন
  {
    id: 'bd_entertainment_gnews',
    tab: 'bangladesh', label: 'Google News — বিনোদন',
    feedUrl: googleNewsSearch('বাংলাদেশ বিনোদন চলচ্চিত্র নাটক সিনেমা হল', BD),
    language: 'bn', region: 'bangladesh', category: 'বিনোদন', priority: 67, trustScore: 84,
  },
  {
    id: 'bd_music_gnews',
    tab: 'bangladesh', label: 'Google News — সংগীত ও শিল্পকলা',
    feedUrl: googleNewsSearch('বাংলাদেশ সংগীত গান শিল্পী কনসার্ট', BD),
    language: 'bn', region: 'bangladesh', category: 'বিনোদন', priority: 66, trustScore: 82,
  },
  {
    id: 'bd_celebrity_gnews',
    tab: 'bangladesh', label: 'Google News — তারকা সংবাদ',
    feedUrl: googleNewsSearch('বাংলাদেশ তারকা অভিনেত্রী অভিনেতা শিল্পী', BD),
    language: 'bn', region: 'bangladesh', category: 'বিনোদন', priority: 65, trustScore: 81,
  },

  // শিক্ষা
  {
    id: 'bd_education_gnews',
    tab: 'bangladesh', label: 'Google News — শিক্ষা',
    feedUrl: googleNewsSearch('বাংলাদেশ শিক্ষা বিশ্ববিদ্যালয়
