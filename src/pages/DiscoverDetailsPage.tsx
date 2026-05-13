import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArticleDetail {
  id: string;
  image: string;
  headline: string;
  source: string;
  sourceAvatar: string;
  timeAgo: string;
  sourceCount?: number;
  language: 'en' | 'bn';
  bullets: string[];
  summary?: string;
  articleUrl?: string;
  category?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFaviconUrl(articleUrl?: string, sourceAvatar?: string): string {
  if (articleUrl) {
    try {
      const hostname = new URL(articleUrl).hostname;
      if (hostname) return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch { /* fall through */ }
  }
  return sourceAvatar || '';
}

function getSummaryText(article: ArticleDetail): string {
  if (article.summary && article.summary.trim().length > 10) return article.summary.trim();
  if (article.bullets && article.bullets.length > 0) return article.bullets[0];
  return article.headline;
}

function getBullets(article: ArticleDetail): string[] {
  if (article.bullets && article.bullets.length > 0) return article.bullets;
  const summary = article.summary?.trim();
  if (summary && summary.length > 10) return [summary];
  return [article.headline];
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailsSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', height: 360, background: '#e5e7eb' }} />
      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 28, background: '#e5e7eb', borderRadius: 8, width: '90%' }} />
        <div style={{ height: 28, background: '#e5e7eb', borderRadius: 8, width: '70%' }} />
        <div style={{ height: 16, background: '#ebebeb', borderRadius: 6, width: '50%', marginTop: 8 }} />
        <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
        <div style={{ height: 15, background: '#ebebeb', borderRadius: 6, width: '100%' }} />
        <div style={{ height: 15, background: '#ebebeb', borderRadius: 6, width: '88%' }} />
        <div style={{ height: 15, background: '#ebebeb', borderRadius: 6, width: '75%' }} />
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: '#6b7280',
      marginBottom: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {text}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DiscoverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [followUp, setFollowUp] = useState('');
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
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

  // ── Loading ──
  if (loading) return <DetailsSkeleton />;

  // ── Not found ──
  if (notFound || !article) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f5f5f7',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ fontSize: 48 }}>📰</div>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Article not found</p>
        <button
          onClick={() => navigate('/discover')}
          style={{
            padding: '10px 24px', borderRadius: 12, background: '#0d9488',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Back to Discover
        </button>
      </div>
    );
  }

  const faviconUrl = getFaviconUrl(article.articleUrl, article.sourceAvatar);
  const summaryText = getSummaryText(article);
  const bullets = getBullets(article);

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

      {/* ── Hero image ── */}
      <div style={{ position: 'relative', width: '100%', height: 360, background: '#e5e7eb' }}>
        {article.image ? (
          <img
            src={article.image}
            alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            onClick={() => navigate('/discover')}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => {}}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
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
      <div style={{ padding: '22px 18px 0' }}>

        {/* Headline */}
        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1.3,
          color: '#111827',
          margin: '0 0 16px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.02em',
        }}>
          {article.headline}
        </h1>

        {/* Source + time row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20, gap: 10, flexWrap: 'wrap' as const,
        }}>
          {/* Source pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', borderRadius: 20,
            padding: '6px 12px 6px 8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt={article.source}
                style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {article.source}
            </span>
            {(article.sourceCount ?? 0) > 1 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#0d9488',
                background: 'rgba(13,148,136,0.09)', borderRadius: 10,
                padding: '1px 7px',
              }}>
                +{(article.sourceCount ?? 1) - 1}
              </span>
            )}
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {article.timeAgo}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#e5e7eb', marginBottom: 24 }} />

        {/* ── Summary section ── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text={article.language === 'bn' ? 'সারসংক্ষেপ' : 'Summary'} />
          <p style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: '#374151',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: '#fff',
            borderRadius: 16,
            padding: '14px 16px',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {summaryText}
          </p>
        </div>

        {/* ── Key points section ── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text={article.language === 'bn' ? 'মূল বিষয়' : 'Key points'} />
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px 16px',
                borderBottom: i < bullets.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#0d9488', marginTop: 8, flexShrink: 0,
                }} />
                <p style={{
                  fontSize: 16, lineHeight: 1.65, color: '#1f2937', margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sources section ── */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel text={article.language === 'bn' ? 'উৎস' : 'Sources'} />
          <div
            onClick={() => {
              if (article.articleUrl) {
                window.open(article.articleUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #f3f4f6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              padding: '14px 16px',
              cursor: article.articleUrl ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            {/* Source header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt={article.source}
                    style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: '#e5e7eb', flexShrink: 0,
                  }} />
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {article.source}
                </span>
              </div>
              {article.articleUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {article.language === 'bn' ? 'পড়ুন' : 'Read'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Source headline */}
            <p style={{
              fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: '#374151',
              margin: 0, fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              {article.headline}
            </p>

            {/* Source excerpt */}
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: '#6b7280', margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              {summaryText}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sticky follow-up bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '10px 14px 22px',
        background: 'rgba(245,245,247,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: '#fff', borderRadius: 20,
            border: '1.5px solid #e5e7eb', padding: '0 14px', height: 48,
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <input
              type="text"
              placeholder="Ask follow-up..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', fontSize: 15, color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            />
            <button style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
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
          <button style={{
            width: 48, height: 48, borderRadius: '50%', background: '#0d9488',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(13,148,136,0.35)',
            WebkitTapHighlightColor: 'transparent', flexShrink: 0,
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
          
