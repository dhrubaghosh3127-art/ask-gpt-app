      import React, { useEffect, useState, useRef, useCallback } from 'react';
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
const BOTTOM_NAV_H = 64;
const PAGE_SIZE = 5;

const SKELETON_CSS = `
@keyframes askgpt-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.askgpt-skeleton {
  background: linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%);
  background-size: 800px 100%;
  animation: askgpt-shimmer 1.4s infinite linear;
  border-radius: 8px;
}
`;
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
function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 26,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      width: '100%',
    }}>
      {/* Image skeleton */}
      <div className="askgpt-skeleton" style={{ width: '100%', height: 220 }} />

      {/* Content skeleton */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Source row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div className="askgpt-skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} />
            <div className="askgpt-skeleton" style={{ width: 80, height: 12 }} />
          </div>
          <div className="askgpt-skeleton" style={{ width: 48, height: 12 }} />
        </div>
        {/* Headline */}
        <div className="askgpt-skeleton" style={{ width: '92%', height: 20, marginBottom: 8 }} />
        <div className="askgpt-skeleton" style={{ width: '75%', height: 20, marginBottom: 14 }} />
        {/* Summary lines */}
        <div className="askgpt-skeleton" style={{ width: '100%', height: 13, marginBottom: 6 }} />
        <div className="askgpt-skeleton" style={{ width: '88%', height: 13, marginBottom: 6 }} />
        <div className="askgpt-skeleton" style={{ width: '60%', height: 13 }} />
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

const toggleTopic = (t: string) => setSelectedTopics(p => {
  const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n;
});
const saveTopics = () => {
  try { localStorage.setItem('topics', JSON.stringify([...selectedTopics])); } catch {}
  setShowPersonalize(false);
};
  const scrollRef = useRef<HTMLDivElement>(null);
const loadingMoreLockRef = useRef(false);
      
useEffect(() => {
  const id = 'askgpt-skeleton-style';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = SKELETON_CSS;
    document.head.appendChild(el);
  }
}, []);
  // Always-fresh ref so scroll handler never goes stale
  const stateRef = useRef({ cards, loading, loadingMore, hasMore, nextCursor, activeTab });
  useEffect(() => {
    stateRef.current = { cards, loading, loadingMore, hasMore, nextCursor, activeTab };
  });

  // ── Load more (background, silent) ───────────────────────────────────────

  const loadMore = useCallback(async () => {
  const { loading: l, loadingMore: lm, hasMore: hm, nextCursor: nc, activeTab: tab } = stateRef.current;
  if (loadingMoreLockRef.current || l || lm || !hm || !nc) return;

  loadingMoreLockRef.current = true;
  setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/discover?tab=${tab}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nc)}`
      );
      const data = await res.json();
      if (stateRef.current.activeTab !== tab) return;
      if (data.ok && Array.isArray(data.cards)) {
        setCards(prev => {
          const existingIds = new Set(prev.map((c: NewsCard) => c.id));
          const fresh = (data.cards as NewsCard[]).filter(c => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
        setNextCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore === true);
      }
    } catch {
      // Silent fail — keep existing cards, no error shown
    } finally {
  loadingMoreLockRef.current = false;
  setLoadingMore(false);
    }
    
  }, []);

  // ── Initial load on tab change ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setCards([]);
    setNextCursor(null);
    setHasMore(true);
    loadingMoreLockRef.current = false;
setLoadingMore(false);

    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    fetch(`/api/discover?tab=${activeTab}&limit=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok && Array.isArray(data.cards)) {
          setCards(data.cards);
          setNextCursor(data.nextCursor ?? null);
          setHasMore(data.hasMore === true);
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

  // ── Scroll trigger ────────────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { cards: c, loading: l, loadingMore: lm, hasMore: hm } = stateRef.current;
    if (l || lm || !hm || c.length === 0) return;

    const itemHeight = el.clientHeight;
    if (itemHeight === 0) return;
    const currentIndex = Math.round(el.scrollTop / itemHeight);

    // When only 3 cards remain ahead, silently load next page
    if (c.length - currentIndex <= 3) {
      loadMore();
    }
  }, [loadMore]);

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

          {/* ── Left: Back + Discover + LIVE ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="#1c1c2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: '#0a0a0f',
                fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
                lineHeight: 1,
              }}>
                Discover
              </span>
              {/* LIVE — same visual weight as title */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.22)',
                borderRadius: 8,
                padding: '4px 8px 4px 6px',
                alignSelf: 'center',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px rgba(16,185,129,0.85)',
                  display: 'inline-block',
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: '#059669',
                  fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
                  lineHeight: 1,
                }}>
                  LIVE
                </span>
              </span>
            </div>
          </div>

          {/* ── Right: Premium heart ── */}
          <button
            style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Saved"
            onClick={() => navigate('/saved')}
          >
            {/* Bookmark icon — cleaner than heart, signals "saved stories" */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="#1c1c2e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
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

      {/* ── Feed area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 32,
          background: 'linear-gradient(to bottom, #f5f5f7 0%, transparent 100%)',
          zIndex: 10, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
          background: 'linear-gradient(to top, #f5f5f7 0%, transparent 100%)',
          zIndex: 10, pointerEvents: 'none',
        }} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            height: '100%',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
            padding: '0 16px',
          }}
        >
          {loading && (
            <div style={{
              minHeight: `calc(100dvh - ${HEADER_H}px)`,
              scrollSnapAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxSizing: 'border-box', padding: '14px 0',
            }}>
              <div style={{ width: '100%' }}>
                <SkeletonCard />
              </div>
            </div>
          )}

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

          {loadingMore && (
            <div style={{
              minHeight: `calc(100dvh - ${HEADER_H}px)`,
              scrollSnapAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxSizing: 'border-box', padding: '14px 0',
            }}>
              <div style={{ width: '100%' }}>
                <SkeletonCard />
              </div>
            </div>
          )}
        </div>
      </div>
          {/* Premium Bottom Navigation */}
<div style={{
  flexShrink: 0,
  background: 'transparent',
  padding: '6px 14px 14px',
  zIndex: 50,
}}>
  <div style={{
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 26,
    boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
    border: '1px solid rgba(230,230,235,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 4px',
    height: 56,
  }}>
    {[
      {
        id: 'home', label: 'Home', active: true,
        icon: (c: string) => (
          <svg width="21" height="21" viewBox="0 0 24 24" fill={c === '#0d9488' ? 'rgba(13,148,136,0.15)' : 'none'}
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        id: 'sources', label: 'Sources', active: false,
        icon: (c: string) => (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 10h16M4 14h10" />
            <circle cx="18" cy="17" r="3" />
            <path d="M21 20l-1.5-1.5" />
          </svg>
        ),
      },
      {
        { id: 'personalized', label: 'Interests', active: false,
        icon: (c: string) => (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        ),
      },
      {
        id: 'notifications', label: 'Alerts', active: false,
        icon: (c: string) => (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        id: 'settings', label: 'Settings', active: false,
        icon: (c: string) => (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
      {/* ── Personalize Bottom Sheet ── */}
{showPersonalize && (
  <div
    onClick={() => setShowPersonalize(false)}
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex', alignItems: 'flex-end',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%',
        background: '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px 36px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
      }}
    >
      {/* Handle */}
      <div style={{
        width: 40, height: 4, borderRadius: 2,
        background: '#d1d1d6',
        margin: '0 auto 20px',
      }} />

      {/* Title */}
      <div style={{
        fontSize: 22, fontWeight: 700, color: '#0a0a14',
        letterSpacing: '-0.025em', marginBottom: 6, textAlign: 'center',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        Personalize Your Feed
      </div>
      <div style={{
        fontSize: 14, color: '#8e8e93', textAlign: 'center',
        marginBottom: 24, fontWeight: 400,
        fontFamily: 'system-ui, sans-serif',
      }}>
        Pick topics to see stories curated for you
      </div>

      {/* Topics Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, marginBottom: 24,
      }}>
        {[
          { id: 'politics',      emoji: '🏛️', label: 'Politics' },
          { id: 'technology',    emoji: '💻', label: 'Technology' },
          { id: 'business',      emoji: '💼', label: 'Business' },
          { id: 'sports',        emoji: '⚽', label: 'Sports' },
          { id: 'science',       emoji: '🔬', label: 'Science' },
          { id: 'health',        emoji: '❤️', label: 'Health' },
          { id: 'entertainment', emoji: '🎬', label: 'Entertainment' },
          { id: 'education',     emoji: '📚', label: 'Education' },
          { id: 'world',         emoji: '🌍', label: 'World News' },
          { id: 'culture',       emoji: '🎨', label: 'Arts & Culture' },
        ].map(topic => {
          const sel = selectedTopics.has(topic.id);
          return (
            <button
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', borderRadius: 16,
                border: sel ? 'none' : '1.5px solid #e5e7eb',
                background: sel ? 'rgba(13,148,136,0.1)' : '#f9f9f9',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
                boxShadow: sel ? 'inset 0 0 0 1.5px #0d9488' : 'none',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{topic.emoji}</span>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: sel ? '#0d9488' : '#374151',
                fontFamily: "'SF Pro Text', system-ui, sans-serif",
              }}>
                {topic.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Save */}
      <button
        onClick={saveTopics}
        style={{
          width: '100%', height: 54,
          borderRadius: 18, border: 'none',
          background: selectedTopics.size > 0
            ? 'linear-gradient(135deg, #0d9488, #0891b2)'
            : '#e5e7eb',
          color: selectedTopics.size > 0 ? '#fff' : '#9ca3af',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          fontFamily: "'SF Pro Text', system-ui, sans-serif",
          boxShadow: selectedTopics.size > 0
            ? '0 4px 20px rgba(13,148,136,0.35)' : 'none',
          transition: 'all 0.2s ease',
          letterSpacing: '-0.01em',
        }}
      >
        {selectedTopics.size > 0
          ? `Save ${selectedTopics.size} Interest${selectedTopics.size > 1 ? 's' : ''}`
          : 'Select at least one topic'}
      </button>
    </div>
  </div>
)}
    ].map(item => {
      const color = item.active ? '#0d9488' : '#52606d';
      return (
        <button
          key={item.id}
        onClick={() => {
  if (item.id === 'home') return;
  if (item.id === 'sources') { navigate('/discover-sources'); return; }
  if (item.id === 'personalized') { setShowPersonalize(true); return; }
  navigate(`/${item.id}`);
}}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            background: item.active ? 'rgba(13,148,136,0.08)' : 'none',
            border: 'none', cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 16,
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.18s ease',
            minWidth: 52,
          }}
        >
          {item.icon(color)}
          <span style={{
            fontSize: 10,
            fontWeight: item.active ? 700 : 500,
            color,
            fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif",
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}>
            {item.label}
          </span>
        </button>
      );
    })}
  </div>
</div>
    </div>
  );
};

export default DiscoverPage;
