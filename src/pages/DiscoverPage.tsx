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

const HEADER_H = 190;
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
      function Card({ card, onClick }: { card: NewsCard; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 4px 20px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        width: '100%',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Image — 16:9 ratio */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
        <img
          src={card.image}
          alt={card.headline}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }}
        />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <CategoryBadge label={card.category} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '13px 14px 16px' }}>
        {/* Source row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
              flexShrink: 0, border: '2px solid #e4e6eb',
            }}>
              <img src={card.sourceAvatar} alt={card.source}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{
                fontSize: 13.5, fontWeight: 700, color: '#050505',
                fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.25,
              }}>
                {card.source}
              </div>
              <div style={{
                fontSize: 11.5, color: '#65676b',
                fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.2, marginTop: 2,
              }}>
                {card.timeAgo}
              </div>
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#65676b">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: '#050505',
          margin: '0 0 7px',
          fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
          letterSpacing: '-0.015em',
        }}>
          {card.headline}
        </h2>

        {/* Summary */}
        <p style={{
          fontSize: 14, lineHeight: 1.55, color: '#65676b', margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {card.summary}
        </p>

        {/* Divider + reaction row */}
        <div style={{ height: 1, background: '#e4e6eb', margin: '13px 0 11px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            {[
              { label: 'Like', icon: '👍' },
              { label: 'Share', icon: '↗' },
            ].map(({ label, icon }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 600, color: '#65676b',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
          <span style={{
            fontSize: 12, color: '#65676b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            Read more →
          </span>
        </div>
      </div>
    </div>
  );
              }
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
      const [loved, setLoved] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'premium' | 'notifications' | 'settings'>('home');
  const [cards, setCards] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

      {/* ── Bottom Navigation Bar ── */}
      <div style={{
        flexShrink: 0,
        background: '#ffffff',
        borderTop: '1px solid #e4e6eb',
        display: 'flex',
        alignItems: 'stretch',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
        boxShadow: '0 -1px 0 rgba(0,0,0,0.05)',
      }}>
        {([
          {
            key: 'home',
            label: 'Home',
            icon: (active: boolean) => (
              <svg width="23" height="23" viewBox="0 0 24 24"
                fill={active ? '#1877f2' : 'none'}
                stroke={active ? '#1877f2' : '#65676b'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
          {
            key: 'premium',
            label: 'Premium',
            icon: (active: boolean) => (
              <svg width="23" height="23" viewBox="0 0 24 24"
                fill={active ? '#1877f2' : 'none'}
                stroke={active ? '#1877f2' : '#65676b'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ),
          },
          {
            key: 'notifications',
            label: 'Alerts',
            icon: (active: boolean) => (
              <svg width="23" height="23" viewBox="0 0 24 24"
                fill={active ? '#1877f2' : 'none'}
                stroke={active ? '#1877f2' : '#65676b'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ),
          },
          {
            key: 'settings',
            label: 'Settings',
            icon: (active: boolean) => (
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#1877f2' : '#65676b'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ),
          },
        ] as const).map(({ key, label, icon }) => {
          const active = activeNavTab === (key as string);
          return (
            <button
              key={key}
              onClick={() => setActiveNavTab(key as any)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4,
                background: 'none', border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                padding: '6px 0 8px',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 36, height: 3,
                  background: '#1877f2',
                  borderRadius: '0 0 4px 4px',
                }} />
              )}
              {icon(active)}
              <span style={{
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                color: active ? '#1877f2' : '#65676b',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
