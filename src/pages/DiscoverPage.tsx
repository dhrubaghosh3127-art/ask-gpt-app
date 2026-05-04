import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const HEADER_H = 126;

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
        boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        width: '100%',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden' }}>
        <img
          src={card.image}
          alt={card.headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <CategoryBadge label={card.category} />
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <img
              src={card.sourceAvatar}
              alt={card.source}
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{
              fontSize: 12.5, fontWeight: 600, color: '#374151',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {card.source}
            </span>
          </div>
          <span style={{
            fontSize: 12, color: '#9ca3af',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {card.timeAgo}
          </span>
        </div>
        <h2 style={{
          fontSize: 18, fontWeight: 700, lineHeight: 1.35, color: '#111827',
          margin: '0 0 8px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.01em',
        }}>
          {card.headline}
        </h2>
        <p style={{
          fontSize: 14, lineHeight: 1.6, color: '#6b7280', margin: 0,
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

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'foryou' | 'bangladesh'>('foryou');
  const [loved, setLoved] = useState(false);
  const [cards, setCards] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setCards([]);
    const limit = activeTab === 'bangladesh' ? 10 : 20;
    fetch(`/api/discover?tab=${activeTab}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok && Array.isArray(data.cards)) {
          setCards(data.cards);
        } else {
          setCards([]);
          setError('Could not load news. Please try again.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCards([]);
        setError('Could not load news. Please try again.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      background: '#f5f5f7',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(245,245,247,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 16px 10px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 44, height: 44, borderRadius: '50%', background: '#fff',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <span style={{
              fontSize: 26, fontWeight: 800, color: '#111827',
              letterSpacing: '-0.03em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              Discover
            </span>
          </div>
          <button
            onClick={() => setLoved(v => !v)}
            style={{
              width: 44, height: 44, borderRadius: '50%', background: '#fff',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              WebkitTapHighlightColor: 'transparent',
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
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingLeft: 2 }}>
          {(['foryou', 'bangladesh'] as const).map(tab => {
            const isActive = activeTab === tab;
            const label = tab === 'foryou' ? 'For You' : '🇧🇩 Bangladesh';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  height: 38, paddingLeft: 16, paddingRight: 16,
                  borderRadius: 12,
                  border: isActive ? 'none' : '1px solid #e5e7eb',
                  background: isActive ? 'rgba(13,148,136,0.1)' : '#fff',
                  color: isActive ? '#0d9488' : '#6b7280',
                  fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
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

      {/* ── Feed area (with peek overlays) ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Top fade overlay — hints at previous card */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 32,
          background: 'linear-gradient(to bottom, #f5f5f7 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />

        {/* Bottom fade overlay — hints at next card */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 32,
          background: 'linear-gradient(to top, #f5f5f7 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />

        {/* Scroll container */}
        <div style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          padding: '0 16px',
        }}>

          {/* Loading */}
          {loading && (
            <div style={{
              minHeight: `calc(100dvh - ${HEADER_H}px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: 15,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              Loading news…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              minHeight: `calc(100dvh - ${HEADER_H}px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: 15,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && cards.length === 0 && (
            <div style={{
              minHeight: `calc(100dvh - ${HEADER_H}px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: 15,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              No news available right now.
            </div>
          )}

          {/* Cards — center snap */}
          {!loading && !error && cards.map(card => (
            <div
              key={card.id}
              style={{
                minHeight: `calc(100dvh - ${HEADER_H}px)`,
                scrollSnapAlign: 'center',
                scrollSnapStop: 'always',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                padding: '14px 0',
              }}
            >
              <div style={{ width: '100%' }}>
                <Card
                  card={card}
                  onClick={() => navigate(`/discover/${card.id}`)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
        
