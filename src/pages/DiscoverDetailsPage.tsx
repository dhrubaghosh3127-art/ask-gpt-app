   import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArticleDetail {
  id: string;
  image: string;
  headline: string;
  source: string;
  sourceAvatar: string;
  timeAgo: string;
  sourceCount: number;
  language: 'en' | 'bn';
  bullets: string[];
}

// ── Full Demo Data ────────────────────────────────────────────────────────────

const ARTICLES: ArticleDetail[] = [
  {
    id: 'fy1',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad979?w=800&q=80',
    headline: "OpenAI releases GPT-5 with real-time voice and vision — here's what changed",
    source: 'MIT Tech Review',
    sourceAvatar: 'https://i.pravatar.cc/40?img=11',
    timeAgo: '2h ago',
    sourceCount: 24,
    language: 'en',
    bullets: [
      'OpenAI released GPT-5, its most capable model yet, with significant improvements in multimodal reasoning across voice, vision, and text.',
      'The new model shows major gains in coding, mathematics, and complex instruction-following in over 50 languages.',
      'Early benchmarks suggest GPT-5 outperforms all previous models on reasoning tasks, with analysts calling it a step toward general-purpose AI assistants.',
    ],
  },
  {
    id: 'fy2',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    headline: "Google DeepMind's new AI can predict protein folding 10x faster than before",
    source: 'The Verge',
    sourceAvatar: 'https://i.pravatar.cc/40?img=22',
    timeAgo: '4h ago',
    sourceCount: 18,
    language: 'en',
    bullets: [
      "Google DeepMind announced a major upgrade to its AlphaFold system, achieving protein structure predictions 10 times faster than its previous version.",
      'The breakthrough is expected to dramatically accelerate drug discovery, potentially cutting years off timelines for developing medicines for cancer and rare diseases.',
      'Researchers from over 30 institutions have already requested access to the new system for ongoing studies.',
    ],
  },
  {
    id: 'fy3',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    headline: 'Global markets rally as Fed signals pause in rate hikes through 2025',
    source: 'Bloomberg',
    sourceAvatar: 'https://i.pravatar.cc/40?img=33',
    timeAgo: '6h ago',
    sourceCount: 31,
    language: 'en',
    bullets: [
      'The US Federal Reserve signaled it may pause interest rate hikes for the remainder of 2025, sending global markets sharply higher.',
      "The S&P 500 reached its highest level this year, while bond yields fell as investors priced in a more accommodative monetary policy.",
      'Economists warn that while the pause is welcome, inflation data in the coming months will be critical to the Fed\'s next decision.',
    ],
  },
  {
    id: 'fy4',
    image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=800&q=80',
    headline: "Apple's mixed-reality headset gets a $1,200 price cut — but is it enough?",
    source: 'Wired',
    sourceAvatar: 'https://i.pravatar.cc/40?img=44',
    timeAgo: '8h ago',
    sourceCount: 15,
    language: 'en',
    bullets: [
      "Apple cut the Vision Pro's entry price by $1,200 and announced a lighter model, in a move analysts say is aimed at growing mainstream adoption.",
      'Despite the price reduction, the headset remains significantly more expensive than competing products from Meta and Samsung.',
      "A rumored 'Vision Air' model is expected to launch next year at a more accessible price point, potentially transforming the market.",
    ],
  },
  {
    id: 'bd1',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    headline: 'Bangladesh secures $3.5B IMF deal to stabilize taka and boost forex reserves',
    source: 'Prothom Alo',
    sourceAvatar: 'https://i.pravatar.cc/40?img=55',
    timeAgo: '1h ago',
    sourceCount: 12,
    language: 'bn',
    bullets: [
      'আন্তর্জাতিক মুদ্রা তহবিল (IMF) বাংলাদেশকে ৩.৫ বিলিয়ন ডলারের নতুন ঋণ সহায়তা অনুমোদন করেছে, যা টাকার স্থিতিশীলতা ও বৈদেশিক মুদ্রার রিজার্ভ বাড়াতে সাহায্য করবে।',
      'চুক্তির শর্ত হিসেবে সরকারকে কর সংস্কার এবং জ্বালানি ভর্তুকি আগামী ২৪ মাসের মধ্যে কমাতে হবে।',
      'অর্থনীতিবিদরা বলছেন, এই চুক্তি বাংলাদেশের অর্থনীতিতে আস্থা ফিরিয়ে আনতে এবং বিদেশি বিনিয়োগ আকর্ষণে গুরুত্বপূর্ণ ভূমিকা রাখবে।',
    ],
  },
  {
    id: 'bd2',
    image: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800&q=80',
    headline: 'Dhaka startup raises $12M Series A to expand AI-powered healthcare across South Asia',
    source: 'The Daily Star',
    sourceAvatar: 'https://i.pravatar.cc/40?img=66',
    timeAgo: '3h ago',
    sourceCount: 9,
    language: 'bn',
    bullets: [
      'ঢাকার একটি স্বাস্থ্যসেবা স্টার্টআপ MediAI সিঙ্গাপুরের একটি ভেঞ্চার ফার্মের নেতৃত্বে ১২ মিলিয়ন ডলারের সিরিজ-এ ফান্ডিং পেয়েছে।',
      'বুয়েট গ্র্যাজুয়েটদের প্রতিষ্ঠিত এই কোম্পানিটি ২০২৬ সালের মধ্যে গ্রামীণ ক্লিনিকে AI-ভিত্তিক রোগ নির্ণয় সরঞ্জাম পৌঁছে দেওয়ার লক্ষ্য রাখে।',
      'বিশেষজ্ঞরা বলছেন, এই ধরনের উদ্যোগ বাংলাদেশের স্বাস্থ্যসেবা খাতে বৈপ্লবিক পরিবর্তন আনতে পারে।',
    ],
  },
  {
    id: 'bd3',
    image: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=800&q=80',
    headline: 'Bangladesh cricket team qualifies for ICC Champions Trophy semifinals',
    source: 'bdnews24',
    sourceAvatar: 'https://i.pravatar.cc/40?img=77',
    timeAgo: '5h ago',
    sourceCount: 21,
    language: 'bn',
    bullets: [
      'সাকিব আল হাসানের অসাধারণ সেঞ্চুরি এবং বোলিং দলের দুর্দান্ত পারফরম্যান্সে বাংলাদেশ দক্ষিণ আফ্রিকাকে ৬ উইকেটে হারিয়ে সেমিফাইনালে জায়গা নিশ্চিত করেছে।',
      'এই জয়ের ফলে বাংলাদেশ আইসিসি চ্যাম্পিয়নস ট্রফির সেমিফাইনালে উঠে ইতিহাস সৃষ্টি করেছে।',
      'ক্রিকেট বিশ্লেষকরা এই পারফরম্যান্সকে বাংলাদেশ দলের গত দশকের সেরা জয়গুলোর একটি বলে মন্তব্য করেছেন।',
    ],
  },
  {
    id: 'bd4',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
    headline: 'Govt launches new digital ID system linked to NID for faster public services',
    source: 'New Age BD',
    sourceAvatar: 'https://i.pravatar.cc/40?img=88',
    timeAgo: '7h ago',
    sourceCount: 7,
    language: 'bn',
    bullets: [
      'বাংলাদেশ সরকার জাতীয় পরিচয়পত্রের সাথে সংযুক্ত নতুন ই-কেওয়াইসি প্ল্যাটফর্ম চালু করেছে, যা ৩০টির বেশি সরকারি সেবা ডিজিটালি সহজলভ্য করবে।',
      'নতুন সিস্টেমের মাধ্যমে জেলা-পর্যায়ের অফিসে সরাসরি উপস্থিত না হয়েও বেশিরভাগ সরকারি সেবা পাওয়া যাবে।',
      'বিশেষজ্ঞরা বলছেন, এই উদ্যোগ ডিজিটাল বাংলাদেশ গড়ার পথে একটি গুরুত্বপূর্ণ পদক্ষেপ।',
    ],
  },
];

// ── Source Count Badge ────────────────────────────────────────────────────────

function SourceBadge({ count }: { count: number }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#f3f4f6',
      borderRadius: 20,
      padding: '5px 12px',
      border: '1px solid #e5e7eb',
    }}>
      {/* Mini source icons */}
      <div style={{ display: 'flex', gap: -4 }}>
        {[11, 22, 33].map((n, i) => (
          <img
            key={n}
            src={`https://i.pravatar.cc/16?img=${n}`}
            style={{
              width: 16, height: 16,
              borderRadius: '50%',
              border: '1.5px solid #fff',
              marginLeft: i === 0 ? 0 : -5,
            }}
            alt=""
          />
        ))}
      </div>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {count} sources
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DiscoverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [followUp, setFollowUp] = useState('');

  const article = ARTICLES.find(a => a.id === id);

  // ── Not found ──
  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <span style={{ fontSize: 48 }}>📰</span>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Article not found</p>
        <button
          onClick={() => navigate('/discover')}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            background: '#0d9488',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Back to Discover
        </button>
      </div>
    );
  }


return (
  <div style={{
    height: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    overscrollBehaviorY: 'contain',
    background: '#f5f5f7',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    paddingBottom: 100,
  }}>

      {/* ── Hero Image with overlay buttons ── */}
      <div style={{ position: 'relative', width: '100%', height: 360 }}>
        <img
          src={article.image}
          alt={article.headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Dark gradient overlay at top for button readability */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
        }} />

        {/* Overlay buttons row */}
        <div style={{
          position: 'absolute',
          top: 16, left: 16, right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* X close button */}
          <button
            onClick={() => navigate('/discover')}
            style={{
              width: 42, height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Three-dot menu */}
          <button
            onClick={() => alert('More options coming soon')}
            style={{
              width: 42, height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px 18px 0' }}>

        {/* Headline */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1.3,
          color: '#111827',
          margin: '0 0 16px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.02em',
        }}>
          {article.headline}
        </h1>

        {/* Source row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap' as const,
          gap: 10,
        }}>
          <SourceBadge count={article.sourceCount} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
              {article.timeAgo}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#e5e7eb', marginBottom: 20 }} />

        {/* Bullet summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {article.bullets.map((bullet, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Bullet dot */}
              <div style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: '#0d9488',
                marginTop: 7,
                flexShrink: 0,
              }} />
              <p style={{
                fontSize: 17,
                lineHeight: 1.65,
                color: '#1f2937',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                {bullet}
              </p>
            </div>
          ))}
        </div>

        {/* Source credit */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 28,
          padding: '12px 14px',
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #f3f4f6',
        }}>
          <img
            src={article.sourceAvatar}
            alt={article.source}
            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            {article.source}
          </span>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
            {article.timeAgo}
          </span>
        </div>
      </div>

      {/* ── Sticky Follow-up Bar ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        padding: '10px 14px 22px',
        background: 'rgba(245,245,247,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Input area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            borderRadius: 20,
            border: '1.5px solid #e5e7eb',
            padding: '0 14px',
            height: 48,
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <input
              type="text"
              placeholder="Ask follow-up..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 15,
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            />
            {/* Mic icon */}
            <button style={{
              background: 'none', border: 'none',
              padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>

          {/* Ask/pencil button */}
          <button style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: '#0d9488',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(13,148,136,0.35)',
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverDetailsPage;                    
