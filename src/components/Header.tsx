import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

// ── Discover thumbnail images — rotates on each load ──────────────────────────
const DISCOVER_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80', // news/world
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80', // tech matrix
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&auto=format&fit=crop&q=80', // space earth
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', // portrait
];
const discoverImg = DISCOVER_IMAGES[Math.floor(Date.now() / 86400000) % DISCOVER_IMAGES.length];

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Listen on the main scroll container — adjust selector if needed
    const el = document.querySelector('main') ?? window;
    const onScroll = () => {
      const top = el === window
        ? window.scrollY
        : (el as Element).scrollTop;
      setScrolled(top > 6);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@500;600&display=swap');

        /* ════════════════════════════════════════
           HEADER SHELL
        ════════════════════════════════════════ */
        .H {
          position: fixed;
          inset-inline: 0;
          top: 0;
          z-index: 50;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          pointer-events: none;
          /* key: isolate so backdrop-filter doesn't bleed */
          isolation: isolate;
        }

        /* the frosted backdrop lives here */
        .H::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          /* start fully transparent */
          background: rgba(249, 249, 251, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          border-bottom: 1px solid transparent;
          transition:
            background        0.25s ease,
            backdrop-filter   0.25s ease,
            -webkit-backdrop-filter 0.25s ease,
            border-color      0.25s ease;
        }
        /* scrolled → solid frosted strip — ChatGPT / Claude style */
        .H.scrolled::after {
          background: rgba(249, 249, 251, 0.88);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom-color: rgba(0, 0, 0, 0.07);
        }

        /* ════════════════════════════════════════
           SHARED GLASS CARD
        ════════════════════════════════════════ */
        .G {
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(255, 255, 255, 0.92);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.85),
            0 0 0 0.5px rgba(0,0,0,0.055),
            0 1px 3px rgba(0,0,0,0.06),
            0 4px 12px rgba(0,0,0,0.07);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          -webkit-tap-highlight-color: transparent;
          transition:
            transform     0.13s cubic-bezier(0.34,1.4,0.64,1),
            box-shadow    0.13s ease,
            background    0.1s  ease;
        }
        .G:active {
          transform: scale(0.90) !important;
          box-shadow:
            0 0 0 0.5px rgba(0,0,0,0.05),
            0 1px 3px rgba(0,0,0,0.07) !important;
          background: rgba(236, 236, 241, 0.96) !important;
        }

        /* ════════════════════════════════════════
           MENU BUTTON
        ════════════════════════════════════════ */
        .M {
          pointer-events: auto;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 5.5px;
          padding: 0 12px;
          cursor: pointer;
        }
        .Mb {
          height: 1.7px;
          border-radius: 99px;
          background: #1a1a2e;
        }
        .Mb:nth-child(1) { width: 20px; }
        .Mb:nth-child(2) { width: 13px; }
        .Mb:nth-child(3) { width: 17px; }

        /* ════════════════════════════════════════
           HISTORY PILL
        ════════════════════════════════════════ */
        .Hp {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 5px;
          height: 40px;
          padding: 0 15px 0 11px;
          border-radius: 50px !important;
          border: none;
          cursor: pointer;
        }
        .Ht {
          font-family: 'Geist', -apple-system, 'SF Pro Display', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1;
        }
        .Hc { color: #9ca3af; display: flex; align-items: center; }
        .Hv { color: #c0c0cc; display: flex; align-items: center; margin-top: 0.5px; }

        /* ════════════════════════════════════════
           DISCOVER — Perplexity style thumbnail
        ════════════════════════════════════════ */
        .D {
          pointer-events: auto;
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 15px;
          border: none;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          /* layered shadow: subtle depth + thin ring */
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.10),
            0 1px 3px rgba(0,0,0,0.12),
            0 6px 20px rgba(0,0,0,0.13);
          transition:
            transform  0.13s cubic-bezier(0.34,1.4,0.64,1),
            box-shadow 0.13s ease;
        }
        .D:active {
          transform: scale(0.88);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.10);
        }
        /* the actual photo */
        .Di {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        /* very subtle dark vignette — photo still shows beautifully */
        .Dov {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(0,0,0,0.04) 0%,
            rgba(0,0,0,0.18) 100%
          );
        }
        /* bottom-left "Discover" micro label */
        .Dl {
          position: absolute;
          bottom: 5px;
          left: 5px;
          display: flex;
          align-items: center;
          gap: 2.5px;
          background: rgba(0,0,0,0.38);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 5px;
          padding: 2px 5px 2px 4px;
          border: 0.5px solid rgba(255,255,255,0.14);
        }
        .Dl-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4ade80; /* green live dot */
          flex-shrink: 0;
        }
        .Dl-text {
          font-family: -apple-system, 'SF Pro Text', sans-serif;
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.93);
          line-height: 1;
        }
      `}</style>

      <header className={`H${scrolled ? ' scrolled' : ''}`}>

        {/* ── Left: Menu ── */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menu"
          className="M G"
        >
          <span className="Mb" />
          <span className="Mb" />
          <span className="Mb" />
        </button>

        {/* ── Center: History ── */}
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="Chat history"
          className="Hp G"
        >
          <span className="Hc">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="Ht">History</span>
          <span className="Hv">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* ── Right: Discover (Perplexity thumbnail style) ── */}
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Discover"
          className="D"
        >
          {/* real photo — changes daily */}
          <img
            className="Di"
            src={discoverImg}
            alt="Discover"
            draggable={false}
            loading="eager"
          />
          {/* vignette */}
          <div className="Dov" />
          {/* live label */}
          <div className="Dl">
            <div className="Dl-dot" />
            <span className="Dl-text">LIVE</span>
          </div>
        </button>

      </header>
    </>
  );
};

export default Header;
  
