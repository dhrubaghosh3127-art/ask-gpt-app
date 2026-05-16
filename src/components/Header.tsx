import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [discoverImg, setDiscoverImg] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // ── Fetch real first Discover card image ──────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch('/api/discover?tab=foryou&limit=1')
      .then(r => r.json())
      .then(data => {
        const img = data?.cards?.[0]?.image;
        if (typeof img === 'string' && img.startsWith('http')) setDiscoverImg(img);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  // ── Scroll detection — works for window AND inner scroll divs ─────────────
  useEffect(() => {
    const targets: EventTarget[] = [window];

    // Also try common scroll containers used by chat UIs
    const selectors = ['main', '[data-scroll]', '.overflow-y-auto', '.overflow-y-scroll'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => targets.push(el));
    });

    const handler = (e: Event) => {
      const el = e.currentTarget as Element | Window;
      const top = 'scrollY' in el ? el.scrollY : (el as Element).scrollTop;
      setScrolled(top > 8);
    };

    targets.forEach(t => t.addEventListener('scroll', handler, { passive: true }));
    return () => targets.forEach(t => t.removeEventListener('scroll', handler));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@500;600&display=swap');

        /* ── Shell ──────────────────────────────── */
        .hdr {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          pointer-events: none;
        }

        /* ── THE BLUR LAYER — separate absolute div ── */
        /* Using a real div (not ::after) = more reliable on mobile webkit */
        .hdr-blur {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          /* default: invisible */
          background: rgba(249, 249, 251, 0);
          -webkit-backdrop-filter: blur(0px);
          backdrop-filter: blur(0px);
          border-bottom: 1px solid transparent;
          transition:
            background 0.22s ease,
            backdrop-filter 0.22s ease,
            -webkit-backdrop-filter 0.22s ease,
            border-color 0.22s ease;
        }
        /* scrolled: solid frosted glass — Claude style */
        .hdr.scrolled .hdr-blur {
          background: rgba(248, 248, 250, 0.90);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          backdrop-filter: blur(28px) saturate(200%);
          border-bottom-color: rgba(0, 0, 0, 0.07);
        }

        /* all interactive children sit above blur layer */
        .hdr > *:not(.hdr-blur) { position: relative; z-index: 1; }

        /* ── Glass button base ──────────────────── */
        .btn-glass {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(0,0,0,0.065);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.80),
            0 1px 2px rgba(0,0,0,0.055),
            0 3px 10px rgba(0,0,0,0.065);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 0.12s cubic-bezier(0.34,1.5,0.64,1),
            box-shadow 0.12s ease,
            background 0.1s ease;
        }
        .btn-glass:active {
          transform: scale(0.88);
          background: rgba(232,232,238,0.97);
          box-shadow: 0 0 0 0.5px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08);
        }

        /* ── Menu ───────────────────────────────── */
        .hdr-menu {
          pointer-events: auto;
          width: 42px;
          height: 42px;
          border-radius: 13px;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 5px;
          padding: 0 11px;
        }
        .bar {
          height: 1.6px;
          border-radius: 99px;
          background: #1c1c2e;
        }
        .bar:nth-child(1) { width: 19px; }
        .bar:nth-child(2) { width: 13px; }
        .bar:nth-child(3) { width: 16px; }

        /* ── History pill ───────────────────────── */
        .hdr-hist {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 5px;
          height: 38px;
          padding: 0 13px 0 10px;
          border-radius: 50px;
          border: none;
        }
        .hist-label {
          font-family: 'Geist', -apple-system, 'SF Pro Display', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1;
        }
        .hist-clock { color: #a0a0ad; display: flex; align-items: center; }
        .hist-chev  { color: #c8c8d4; display: flex; align-items: center; margin-top: 0.5px; }

        /* ── Discover ───────────────────────────── */
        .hdr-disc {
          pointer-events: auto;
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 15px;
          border: none;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.09),
            0 2px 4px rgba(0,0,0,0.11),
            0 8px 22px rgba(0,0,0,0.14);
          transition:
            transform 0.12s cubic-bezier(0.34,1.5,0.64,1),
            box-shadow 0.12s ease;
          background: #e5e5ea; /* fallback while loading */
        }
        .hdr-disc:active {
          transform: scale(0.87);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.09);
        }
        .disc-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        /* placeholder skeleton when no image yet */
        .disc-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #e8e8f0 0%, #d4d4e0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* thin dark scrim so label is legible on any photo */
        .disc-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(0,0,0,0.02) 0%,
            rgba(0,0,0,0.22) 100%
          );
        }
        /* live / discover chip */
        .disc-chip {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(0,0,0,0.42);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          border: 0.5px solid rgba(255,255,255,0.18);
          border-radius: 5px;
          padding: 2px 5px 2px 4px;
          white-space: nowrap;
        }
        .disc-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34d399;
          flex-shrink: 0;
          box-shadow: 0 0 4px rgba(52,211,153,0.8);
        }
        .disc-txt {
          font-family: -apple-system, 'SF Pro Text', sans-serif;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.92);
          line-height: 1;
        }
      `}</style>

      <header className={`hdr${scrolled ? ' scrolled' : ''}`}>
        {/* blur panel — sits behind buttons */}
        <div className="hdr-blur" />

        {/* ── Left: Menu ── */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menu"
          className="hdr-menu btn-glass"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        {/* ── Center: History ── */}
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="Chat history"
          className="hdr-hist btn-glass"
        >
          <span className="hist-clock">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.3"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="hist-label">History</span>
          <span className="hist-chev">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* ── Right: Discover (real card image) ── */}
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Discover"
          className="hdr-disc"
        >
          {discoverImg ? (
            <img className="disc-img" src={discoverImg} alt="" draggable={false} />
          ) : (
            <div className="disc-skeleton">
              {/* compass icon as placeholder */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="rgba(120,120,140,0.6)" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
          )}
          <div className="disc-scrim" />
          <div className="disc-chip">
            <div className="disc-dot" />
            <span className="disc-txt">LIVE</span>
          </div>
        </button>
      </header>
    </>
  );
};

export default Header;
      
