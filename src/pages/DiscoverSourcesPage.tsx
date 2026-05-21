import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISCOVER_SOURCES } from '../../api/_lib/discoverSources';

const BOTTOM_NAV_H = 76;

function avatarColor(id: string): string {
  const colors = ['#0d9488','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#6366f1','#ec4899'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function initials(label: string): string {
  const w = label.split(/[\s\-—]+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

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

  const filtered = useMemo(() =>
    DISCOVER_SOURCES
      .filter(s => s.tab === activeTab)
      .filter(s => !search ||
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.priority - a.priority),
    [activeTab, search]
  );

  const navItems = [
    { id: 'home', label: 'Home', active: false, d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10' },
    { id: 'sources', label: 'Sources', active: true, d: 'M4 6h16M4 10h16M4 14h10' },
    { id: 'personalized', label: 'For You', active: false, d: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z' },
    { id: 'notifications', label: 'Alerts', active: false, d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
    { id: 'settings', label: 'Settings', active: false, d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  ];

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#f5f5f7',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
          <span style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em',
            color: '#0a0a0f',
            fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
            lineHeight: 1,
          }}>
            Discover Sources
          </span>
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          padding: '0 12px', height: 42, marginBottom: 10,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sources..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: '#1f2937',
              background: 'transparent',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, display: 'flex', alignItems: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, paddingLeft: 2 }}>
          {(['foryou', 'bangladesh'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                height: 36, paddingLeft: 14, paddingRight: 14,
                borderRadius: 12,
                border: isActive ? 'none' : '1px solid #e5e7eb',
                background: isActive ? 'rgba(13,148,136,0.1)' : '#fff',
                color: isActive ? '#0d9488' : '#6b7280',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                {tab === 'foryou' ? '🌐 Global' : '🇧🇩 Bangladesh'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Source List ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '10px 14px 8px',
      }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#9ca3af',
            fontSize: 15, marginTop: 48,
            fontFamily: 'system-ui, sans-serif',
          }}>
            No sources found
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {filtered.map((source, idx) => {
            const isSub = subscribed.has(source.id);
            const color = avatarColor(source.id);
            const abbr = initials(source.label);
            return (
              <div key={source.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                borderBottom: idx < filtered.length - 1
                  ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${color}44`,
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    letterSpacing: '0.02em',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}>
                    {abbr}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#111827',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 2,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}>
                    {source.label}
                  </div>
                  <div style={{
                    fontSize: 12.5, color: '#9ca3af',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textTransform: 'capitalize' as const,
                  }}>
                    {source.category}
                  </div>
                </div>

                {/* Subscribe button */}
                <button
                  onClick={() => toggle(source.id)}
                  style={{
                    flexShrink: 0,
                    height: 32, paddingLeft: 13, paddingRight: 13,
                    borderRadius: 10,
                    border: isSub ? 'none' : '1.5px solid #0d9488',
                    background: isSub ? 'rgba(13,148,136,0.1)' : 'transparent',
                    color: '#0d9488',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {isSub ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Premium Bottom Nav (Sources active) ── */}
      <div style={{
        flexShrink: 0, background: 'transparent',
        padding: '6px 14px 14px', zIndex: 50,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 26,
          boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          border: '1px solid rgba(230,230,235,0.7)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 4px', height: 56,
        }}>
          {navItems.map(item => {
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
                  minWidth: 52,
                }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
                  stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d} />
                </svg>
                <span style={{
                  fontSize: 10, fontWeight: item.active ? 700 : 500,
                  color, letterSpacing: '0.01em', lineHeight: 1,
                  fontFamily: "'SF Pro Text', system-ui, sans-serif",
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
