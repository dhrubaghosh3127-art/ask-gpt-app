import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

// ── Module-level image cache — survives re-renders, no duplicate fetches ──────
let _imgs: string[] = [];
let _fetching = false;
const _listeners: Array<(imgs: string[]) => void> = [];

function fetchDiscoverImages(cb: (imgs: string[]) => void) {
  if (_imgs.length >= 2) { cb(_imgs); return; }
  _listeners.push(cb);
  if (_fetching) return;
  _fetching = true;
  fetch('/api/discover?tab=foryou&limit=3')
    .then(r => r.json())
    .then(data => {
      const cards: { image?: string }[] = data?.cards ?? [];
      _imgs = cards
        .map(c => c.image ?? '')
        .filter(u => u.startsWith('http'))
        .slice(0, 2);
      _listeners.forEach(fn => fn(_imgs));
      _listeners.length = 0;
    })
    .catch(() => { _fetching = false; });
}

// ─────────────────────────────────────────────────────────────────────────────

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate    = useNavigate();
  const headerRef   = useRef<HTMLElement>(null);
  const [stuck, setStuck]     = useState(false);
  const [imgs, setImgs]       = useState<string[]>(_imgs);

  // ── Detect when sticky header becomes "stuck" ─────────────────────────────
  // Works 100% — no scroll listener needed, no sidebar overlap.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => setStuck(e.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Fetch real discover card images ───────────────────────────────────────
  useEffect(() => {
    fetchDiscoverImages(result => setImgs([...result]));
  }, []);

  const img1 = imgs[0] ?? null;
  const img2 = imgs[1] ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@500;600&display=swap');

        /* ══════════════════════════════════════════════
           HEADER — sticky, NEVER overlaps sidebar
        ══════════════════════════════════════════════ */
        .H {
          position: sticky;        /* key: stays in document flow  */
          top: 0;
          z-index: 30;             /* below sidebar (sidebar = z-40+) */
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          /* transparent by default */
          background: transparent;
          transition: background 0.2s ease, border-color 0.2s ease;
          border-bottom: 1px solid transparent;
        }

        /* ChatGPT-style: pure frosted blur when stuck ────────────── */
        .H.stuck {
          background: rgba(255,255,255,0.82);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
                  backdrop-filter: blur(24px) saturate(180%);
          border-bottom-color: rgba(0,0,0,0.07);
        }

        /* ══════════════════════════════════════════════
           MENU — ChatGPT icon style, no card bg
        ══════════════════════════════════════════════ */
        .H-menu {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 5px;
          padding: 0 9px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.1s ease, transform 0.12s cubic-bezier(0.34,1.4,0.64,1);
        }
        .H-menu:active {
          background: rgba(0,0,0,0.06);
          transform: scale(0.90);
        }
        .H-bar {
          height: 1.7px;
          border-radius: 99px;
          background: #1c1c2e;
        }
        .H-bar:nth-child(1) { width: 19px; }
        .H-bar:nth-child(2) { width: 13px; }
        .H-bar:nth-child(3) { width: 17px; }

        /* ══════════════════════════════════════════════
           HISTORY — slim pill, ChatGPT-style minimal
        ══════════════════════════════════════════════ */
        .H-hist {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 36px;
          padding: 0 12px 0 10px;
          border-radius: 50px;
          border: 1px solid rgba(0,0,0,0.09);
          background: rgba(255,255,255,0.70);
          -webkit-backdrop-filter: blur(8px);
                  backdrop-filter: blur(8px);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.12s cubic-bezier(0.34,1.4,0.64,1),
                      background 0.1s ease;
        }
        .H-hist:active {
          transform: scale(0.91);
          background: rgba(232,232,238,0.95);
        }
        .H-hist-label {
          font-family: 'Geist', -apple-system, 'SF Pro Display', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1;
        }
        .H-hist-ic  { color: #a0a0ad; display: flex; align-items: center; }
        .H-hist-chv { color: #c0c0cc; display: flex; align-items: center; margin-top: 0.5px; }

        /* ══════════════════════════════════════════════
           DISCOVER — Perplexity 2-stack overlapping
        ══════════════════════════════════════════════ */
        .H-disc {
          position: relative;
          width: 62px;   /* wide enough for 2 overlapping images */
          height: 42px;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.12s cubic-bezier(0.34,1.4,0.64,1);
        }
        .H-disc:active { transform: scale(0.88); }

        /* image cards */
        .H-disc-a,
        .H-disc-b {
          position: absolute;
          top: 50%;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          overflow: hidden;
          transform: translateY(-50%);
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.18);
        }
        /* back card: slightly rotated, lower z */
        .H-disc-b {
          left: 0;
          z-index: 1;
          transform: translateY(-50%) rotate(-6deg) scale(0.93);
          box-shadow: 0 0 0 2px #fff, 0 1px 6px rgba(0,0,0,0.15);
        }
        /* front card: on top */
        .H-disc-a {
          left: 20px;
          z-index: 2;
        }
        .H-disc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* skeleton while loading */
        .H-disc-sk {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #e2e2ea, #cbcbd6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* scrim + LIVE chip on front card */
        .H-disc-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, transparent 40%, rgba(0,0,0,0.30) 100%);
        }
        .H-disc-chip {
          position: absolute;
          bottom: 4px;
          right: 3px;
          display: flex;
          align-items: center;
          gap: 2.5px;
          background: rgba(0,0,0,0.48);
          -webkit-backdrop-filter: blur(6px);
                  backdrop-filter: blur(6px);
          border: 0.5px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 1.5px 4px 1.5px 3px;
        }
        .H-disc-dot {
          width: 4.5px;
          height: 4.5px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 5px rgba(52,211,153,0.9);
          flex-shrink: 0;
        }
        .H-disc-txt {
          font-size: 6.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.93);
          line-height: 1;
          font-family: -apple-system, 'SF Pro Text', sans-serif;
        }
      `}</style>

      {/* ── Header (sticky — sidebar safe) ── */}
      <header ref={headerRef} className={`H${stuck ? ' stuck' : ''}`}>

        {/* Left: Menu */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menu"
          className="H-menu"
        >
          <span className="H-bar" />
          <span className="H-bar" />
          <span className="H-bar" />
        </button>

        {/* Center: History */}
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="Chat history"
          className="H-hist"
        >
          <span className="H-hist-ic">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="H-hist-label">History</span>
          <span className="H-hist-chv">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* Right: Discover — 2 overlapping cards */}
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Discover"
          className="H-disc"
        >
          {/* Back image (rotated, behind) */}
          <div className="H-disc-b">
            {img2 ? (
              <img className="H-disc-img" src={img2} alt="" draggable={false} />
            ) : (
              <div className="H-disc-sk">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(100,100,120,0.5)" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              </div>
            )}
          </div>

          {/* Front image (on top) */}
          <div className="H-disc-a">
            {img1 ? (
              <img className="H-disc-img" src={img1} alt="" draggable={false} />
            ) : (
              <div className="H-disc-sk">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(100,100,120,0.5)" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              </div>
            )}
            <div className="H-disc-scrim" />
            <div className="H-disc-chip">
              <div className="H-disc-dot" />
              <span className="H-disc-txt">LIVE</span>
            </div>
          </div>
        </button>

      </header>
    </>
  );
};

export default Header;
        
