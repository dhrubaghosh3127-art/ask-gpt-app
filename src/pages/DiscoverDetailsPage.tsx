   import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// ── Favicon helper ────────────────────────────────────────────────────────────

function getFaviconUrl(articleUrl?: string, sourceAvatar?: string): string {
  if (articleUrl) {
    try {
      const hostname = new URL(articleUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch { /* invalid URL */ }
  }
  return sourceAvatar ?? '';
}

// ── Source Count Badge ────────────────────────────────────────────────────────

<SourceBadge
            count={article.sourceCount ?? 1}
            sourceAvatar={article.sourceAvatar}
            articleUrl={article.articleUrl}
          />

// ── Main Page ─────────────────────────────────────────────────────────────────
const DiscoverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [followUp, setFollowUp] = useState('');
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    fetch(`/api/discover-article?id=${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.article) {
          setArticle(data.article as ArticleDetail);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);
   if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#9ca3af',
        fontSize: 15,
      }}>
        Loading…
      </div>
    );
         }

  // ── Not found ──
  if (notFound || !article) {
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
          <SourceBadge count={article.sourceCount ?? 1} />
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

        {/* Summary */}
        <div style={{ marginBottom: 24 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
            color: '#0d9488',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            Summary
          </span>
          <p style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: '#1f2937',
            margin: '8px 0 0',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            {article.summary || article.bullets[0] || ''}
          </p>
        </div>
         
        {/* Key points */}
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase' as const,
          color: '#0d9488',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'block',
          marginBottom: 14,
        }}>
          Key points
        </span>
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

       {/* Sources */}
        <div style={{ marginTop: 32, marginBottom: 4 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
            color: '#0d9488',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            Sources
          </span>
          <div
            onClick={() => {
              if (article.articleUrl) {
                window.open(article.articleUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              marginTop: 12,
              padding: '14px',
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              cursor: article.articleUrl ? 'pointer' : 'default',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <img
              src={getFaviconUrl(article.articleUrl, article.sourceAvatar)}
              alt={article.source}
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#374151',
                margin: '0 0 4px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                {article.source}
              </p>
              <p style={{
                fontSize: 13,
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.5,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
              }}>
                {article.summary || article.bullets[0] || article.headline}
              </p>
            </div>
            {article.articleUrl && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            )}
          </div>
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
