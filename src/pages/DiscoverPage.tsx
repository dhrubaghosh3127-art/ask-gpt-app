import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────────

interface NewsCard {
  id: string;
  image: string;
  source: string;
  sourceAvatar: string;
  timeAgo: string;
  headline: string;
  summary: string;
  category: string;
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const FOR_YOU_CARDS: NewsCard[] = [
  {
    id: 'fy1',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad979?w=800&q=80',
    source: 'MIT Tech Review',
    sourceAvatar: 'https://i.pravatar.cc/40?img=11',
    timeAgo: '2h ago',
    headline: 'OpenAI releases GPT-5 with real-time voice and vision — here\'s what changed',
    summary: 'The latest flagship model brings multimodal reasoning to everyday users, with significant improvements in coding, math, and complex instruction following across 50+ languages.',
    category: 'AI',
  },
  {
    id: 'fy2',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    source: 'The Verge',
    sourceAvatar: 'https://i.pravatar.cc/40?img=22',
    timeAgo: '4h ago',
    headline: 'Google DeepMind\'s new AI can predict protein folding 10x faster than before',
    summary: 'Researchers say the breakthrough could dramatically accelerate drug discovery, cutting years off the development timeline for new medicines targeting cancer and rare diseases.',
    category: 'Science',
  },
  {
    id: 'fy3',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    source: 'Bloomberg',
    sourceAvatar: 'https://i.pravatar.cc/40?img=33',
    timeAgo: '6h ago',
    headline: 'Global markets rally as Fed signals pause in rate hikes through 2025',
    summary: 'Wall Street surged Wednesday following signals from Federal Reserve officials that interest rate hikes may be on hold, sending the S&P 500 to its highest level this year.',
    category: 'Finance',
  },
  {
    id: 'fy4',
    image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=800&q=80',
    source: 'Wired',
    sourceAvatar: 'https://i.pravatar.cc/40?img=44',
    timeAgo: '8h ago',
    headline: 'Apple\'s mixed-reality headset gets a $1,200 price cut — but is it enough?',
    summary: 'Apple quietly dropped the Vision Pro entry price and announced a lighter model. Analysts say the move signals a push to grow adoption before a rumored Vision Air launches next year.',
    category: 'Tech',
  },
];

const BANGLADESH_CARDS: NewsCard[] = [
  {
    id: 'bd1',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    source: 'Prothom Alo',
    sourceAvatar: 'https://i.pravatar.cc/40?img=55',
    timeAgo: '1h ago',
    headline: 'Bangladesh secures $3.5B IMF deal to stabilize taka and boost forex reserves',
    summary: 'The International Monetary Fund has approved a new extended credit facility for Bangladesh, conditioned on tax reform and reduced fuel subsidies over the next 24 months.',
    category: 'Economy',
  },
  {
    id: 'bd2',
    image: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800&q=80',
    source: 'The Daily Star',
    sourceAvatar: 'https://i.pravatar.cc/40?img=66',
    timeAgo: '3h ago',
    headline: 'Dhaka startup raises $12M Series A to expand AI-powered healthcare across South Asia',
    summary: 'MediAI, founded by BUET graduates, has closed a significant funding round led by a Singapore-based venture firm, aiming to bring diagnostic tools to rural clinics by 2026.',
    category: 'Startup',
  },
  {
    id: 'bd3',
    image: 'https://images.unsplash.com/photo-1572373618967-5e1b6b5e7e9a?w=800&q=80',
    source: 'bdnews24',
    sourceAvatar: 'https://i.pravatar.cc/40?img=77',
    timeAgo: '5h ago',
    headline: 'Bangladesh cricket team qualifies for ICC Champions Trophy semifinals after stunning win',
    summary: 'A brilliant century by Shakib Al Hasan and a disciplined bowling performance helped Bangladesh defeat South Africa by 6 wickets in a high-pressure group stage match.',
    category: 'Sports',
  },
  {
    id: 'bd4',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
    source: 'New Age BD',
    sourceAvatar: 'https://i.pravatar.cc/40?img=88',
    timeAgo: '7h ago',
    headline: 'Govt launches new digital ID system linked to NID for faster public services',
    summary: 'Bangladesh\'s new e-KYC platform will streamline access to over 30 government services digitally, reducing wait times and in-person visits at district-level offices.',
    category: 'Gov',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      color: '#0d9488',
      background: 'rgba(13,148,136,0.09)',
      borderRadius: 6,
      padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

function Card({ card, onClick }: { card: NewsCard; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 26,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.985)')}
      onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden' }}>
        <img
          src={card.image}
          alt={card.headline}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* Category badge overlay */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
        }}>
          <CategoryBadge label={card.category} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Meta row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <img
              src={card.sourceAvatar}
              alt={card.source}
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#374151',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {card.source}
            </span>
          </div>
          <span style={{
            fontSize: 12,
            color: '#9ca3af',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {card.timeAgo}
          </span>
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.35,
          color: '#111827',
          margin: '0 0 8px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.01em',
        }}>
          {card.headline}
        </h2>

        {/* Summary */}
        <p style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: '#6b7280',
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {card.summary}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'foryou' | 'bangladesh'>('foryou');
  const [loved, setLoved] = useState(false);

  const cards = activeTab === 'foryou' ? FOR_YOU_CARDS : BANGLADESH_CARDS;

  return (
    <div style={{
  height: '100dvh',
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  overscrollBehaviorY: 'contain',
  background: '#f5f5f7',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
}}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(245,245,247,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 16px 10px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <span style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.03em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              Discover
            </span>
          </div>

          {/* Heart / Love button */}
          <button
            onClick={() => setLoved(v => !v)}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: '#fff',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.15s ease',
            }}
          >
            {loved ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
          paddingLeft: 2,
        }}>
          {(['foryou', 'bangladesh'] as const).map(tab => {
            const isActive = activeTab === tab;
            const label = tab === 'foryou' ? 'For You' : '🇧🇩 Bangladesh';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  height: 38,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 12,
                  border: isActive ? 'none' : '1px solid #e5e7eb',
                  background: isActive ? 'rgba(13,148,136,0.1)' : '#fff',
                  color: isActive ? '#0d9488' : '#6b7280',
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                  WebkitTapHighlightColor: 'transparent',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Feed ── */}
      <div style={{ padding: '16px 16px 32px' }}>
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            onClick={() => navigate(`/discover/${card.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default DiscoverPage;
