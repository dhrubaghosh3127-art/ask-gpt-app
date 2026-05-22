import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISCOVER_SOURCES } from '../../api/_lib/discoverSources';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDomain(feedUrl: string): string {
  try {
    const hostname = new URL(feedUrl).hostname;
    return hostname
      .replace(/^(feeds\.|rss\.|bangla\.|bengali\.|m\.)/, '')
      .replace(/^www\./, '');
  } catch { return ''; }
}

function initials(label: string): string {
  const w = label.split(/[\s\-—–]+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

function avatarColor(id: string): string {
  const colors = [
    '#0d9488','#3b82f6','#8b5cf6','#f59e0b',
    '#ef4444','#10b981','#6366f1','#ec4899',
    '#0ea5e9','#84cc16','#f97316','#a855f7',
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ── Source Logo Component ────────────────────────────────────────────────────

const SourceLogo: React.FC<{ feedUrl: string; label: string; color: string }> = ({
  feedUrl, label, color,
}) => {
  const domain = getDomain(feedUrl);
  const sources = domain ? [
    `https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ] : [];
  const [idx, setIdx] = React.useState(0);

  if (idx < sources.length) {
    return (
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={sources[idx]}
          alt={label}
          onError={() => setIdx(i => i + 1)}
          style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 6 }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 3px 10px ${color}55`,
    }}>
      <span style={{
        fontSize: 15, fontWeight: 800, color: '#fff',
        letterSpacing: '0.02em',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        {initials(label)}
      </span>
    </div>
  );
};

// ── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'home', label: 'Home', active: false,
    path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  },
  {
    id: 'sources', label: 'Sources', active: true,
    path: 'M4 6h16M4 10h16M4 14h10M4 18h7',
  },
  {
    id: 'personalized', label: 'For You', active: false,
    path: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
  },
  {
    id: 'notifications', label: 'Alerts', active: false,
    path: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  },
  {
    id: 'settings', label: 'Settings', active: false,
    path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  },
];

// ── Main Page ────────────────────────────────────────────────────────────────

const DiscoverSourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'foryou' | 'bangladesh'>('foryou');
  const [search, setSearch] = useState('');
  const [subscribed, setSubscribed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('disc_subs') || '[]')); }
    catch { return new Set(); }
  });

  const toggle = (id: string) => {
    setSubscribed(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      try { localStorage.setItem('disc_subs', JSON.stringify([...n])); } catch {}
      return n;
    });
  };

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    return DISCOVER_SOURCES
      .filter(s => {
        if (s.tab !== activeTab) return false;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .filter(s =>
        !search ||
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.priority - a.priority);
  }, [activeTab, search]);

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f2f2f7',
      fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overscrollBehavior: 'none',
    }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(242,242,247,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '14px 16px 0',
        zIndex: 40,
      }}>
        {/* Title Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <button
            onClick={() => navigate('/discover')}
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 5px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#1c1c2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em',
              color: '#0a0a14', lineHeight: 1.15,
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            }}>
              Discover Sources
            </div>
            <div style={{ fontSize: 12.5, color: '#8e8e93', marginTop: 1 }}>
              {filtered.length} sources available
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 13,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          padding: '0 13px', height: 44,
          marginBottom: 12,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#aeaeb2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sources..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15.5, color: '#1c1c2e',
              background: 'transparent',
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: '#aeaeb2', border: 'none', cursor: 'pointer',
              width: 18, height: 18, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 8,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          paddingBottom: 0,
        }}>
          {(['foryou', 'bangladesh'] as const).map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                height: 40, paddingLeft: 16, paddingRight: 16,
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: active ? '#0d9488' : '#8e8e93',
                fontSize: 14.5, fontWeight: active ? 700 : 500,
                borderBottom: active ? '2.5px solid #0d9488' : '2.5px solid transparent',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              }}>
                {tab === 'foryou' ? '🌐  Global' : '🇧🇩  Bangladesh'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Source List ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        padding: '12px 14px 8px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingTop: 60, color: '#aeaeb2',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#d1d1d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <div style={{ marginTop: 12, fontSize: 15, fontWeight: 500 }}>
              No sources found
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {filtered.map((source, idx) => {
              const isSub = subscribed.has(source.id);
              const color = avatarColor(source.id);
              const isLast = idx === filtered.length - 1;

              return (
                <div key={source.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '13px 16px',
                  borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.055)',
                  transition: 'background 0.12s ease',
                }}>
                  {/* Logo */}
                  <SourceLogo
                    feedUrl={source.feedUrl}
                    label={source.label}
                    color={color}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15.5, fontWeight: 600, color: '#0a0a14',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                    }}>
                      {source.label}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      marginTop: 4,
                      background: 'rgba(142,142,147,0.1)',
                      borderRadius: 6, padding: '2px 7px',
                    }}>
                      <span style={{
                        fontSize: 11.5, color: '#636366', fontWeight: 500,
                        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                        letterSpacing: '0.01em',
                      }}>
                        {source.category}
                      </span>
                    </div>
                  </div>

                  {/* Subscribe Button */}
                  <button
                    onClick={() => toggle(source.id)}
                    style={{
                      flexShrink: 0,
                      height: 33,
                      paddingLeft: 14,
                      paddingRight: 14,
                      borderRadius: 10,
                      border: isSub
                        ? '1.5px solid rgba(142,142,147,0.25)'
                        : '1.5px solid #0d9488',
                      background: isSub
                        ? 'rgba(142,142,147,0.08)'
                        : 'rgba(13,148,136,0.07)',
                      color: isSub ? '#8e8e93' : '#0d9488',
                      fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {isSub ? '✓ Subscribed' : 'Subscribe'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom spacing */}
        <div style={{ height: 16 }} />
      </div>

      {/* ── Premium Bottom Nav ── */}
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
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          border: '1px solid rgba(230,230,235,0.7)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 4px', height: 56,
        }}>
          {NAV_ITEMS.map(item => {
            const color = item.active ? '#0d9488' : '#52606d';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'home') navigate('/discover');
                  else if (item.id !== 'sources') navigate(`/${item.id}`);
                }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 3,
                  background: item.active ? 'rgba(13,148,136,0.08)' : 'none',
                  border: 'none', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: 16,
                  WebkitTapHighlightColor: 'transparent',
                  minWidth: 52, transition: 'background 0.15s ease',
                }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
                  stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.path} />
                </svg>
                <span style={{
                  fontSize: 10, fontWeight: item.active ? 700 : 500,
                  color, letterSpacing: '0.01em', lineHeight: 1,
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
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

export default DiscoverSourcesPage;
    
