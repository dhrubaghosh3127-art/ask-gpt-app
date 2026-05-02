type NewsCard = {
  id: string;
  image: string;
  source: string;
  sourceAvatar: string;
  timeAgo: string;
  headline: string;
  summary: string;
  category: string;
};

const FOR_YOU_CARDS: NewsCard[] = [
  {
    id: "fy1",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad979?w=800&q=80",
    source: "MIT Tech Review",
    sourceAvatar: "https://i.pravatar.cc/40?img=11",
    timeAgo: "2h ago",
    headline: "OpenAI releases GPT-5 with real-time voice and vision — here's what changed",
    summary: "The latest flagship model brings multimodal reasoning to everyday users, with significant improvements in coding, math, and complex instruction following across 50+ languages.",
    category: "AI",
  },
  {
    id: "fy2",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    source: "The Verge",
    sourceAvatar: "https://i.pravatar.cc/40?img=22",
    timeAgo: "4h ago",
    headline: "Google DeepMind's new AI can predict protein folding 10x faster than before",
    summary: "Researchers say the breakthrough could dramatically accelerate drug discovery, cutting years off the development timeline for new medicines.",
    category: "Science",
  },
  {
    id: "fy3",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    source: "Bloomberg",
    sourceAvatar: "https://i.pravatar.cc/40?img=33",
    timeAgo: "6h ago",
    headline: "Global markets rally as Fed signals pause in rate hikes through 2025",
    summary: "Wall Street surged following signals from Federal Reserve officials that interest rate hikes may be on hold.",
    category: "Finance",
  },
  {
    id: "fy4",
    image: "https://images.unsplash.com/photo-1618044733300-9472054094ee?w=800&q=80",
    source: "Wired",
    sourceAvatar: "https://i.pravatar.cc/40?img=44",
    timeAgo: "8h ago",
    headline: "Apple's mixed-reality headset gets a $1,200 price cut — but is it enough?",
    summary: "Apple quietly dropped the Vision Pro entry price and announced a lighter model, aiming to grow adoption.",
    category: "Tech",
  },
];

const BANGLADESH_CARDS: NewsCard[] = [
  {
    id: "bd1",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    source: "Prothom Alo",
    sourceAvatar: "https://i.pravatar.cc/40?img=55",
    timeAgo: "1h ago",
    headline: "Bangladesh secures $3.5B IMF deal to stabilize taka and boost forex reserves",
    summary: "The International Monetary Fund has approved a new credit facility for Bangladesh, focused on reserves and reform.",
    category: "Economy",
  },
  {
    id: "bd2",
    image: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800&q=80",
    source: "The Daily Star",
    sourceAvatar: "https://i.pravatar.cc/40?img=66",
    timeAgo: "3h ago",
    headline: "Dhaka startup raises $12M Series A to expand AI-powered healthcare across South Asia",
    summary: "A Dhaka-based healthcare AI startup is preparing to expand diagnostic tools across rural clinics.",
    category: "Startup",
  },
  {
    id: "bd3",
    image: "https://images.unsplash.com/photo-1572373618967-5e1b6b5e7e9a?w=800&q=80",
    source: "bdnews24",
    sourceAvatar: "https://i.pravatar.cc/40?img=77",
    timeAgo: "5h ago",
    headline: "Bangladesh cricket team qualifies for ICC Champions Trophy semifinals after stunning win",
    summary: "Bangladesh delivered a strong all-round performance to secure a major tournament victory.",
    category: "Sports",
  },
  {
    id: "bd4",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
    source: "New Age BD",
    sourceAvatar: "https://i.pravatar.cc/40?img=88",
    timeAgo: "7h ago",
    headline: "Govt launches new digital ID system linked to NID for faster public services",
    summary: "The new e-KYC platform aims to make access to government services faster and more digital.",
    category: "Gov",
  },
];

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const tab = String(req.query.tab || "foryou").toLowerCase();
  const limit = Number(req.query.limit || 20);

  const cards = tab === "bangladesh" ? BANGLADESH_CARDS : FOR_YOU_CARDS;

  return res.status(200).json({
    ok: true,
    tab,
    cards: cards.slice(0, limit),
  });
    }
