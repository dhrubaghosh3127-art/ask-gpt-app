import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@500;600&display=swap');

        /* ── Shell ── */
        .hdr {
          position: fixed;
          inset-inline: 0;
          top: 0;
          z-index: 50;
          height: 68px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
          isolation: isolate;
        }
        .hdr::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(249,249,251,0.0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          border-bottom: 1px solid transparent;
          transition: background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease;
          z-index: -1;
        }
        .hdr.scrolled::before {
          background: rgba(249,249,251,0.85);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border-bottom-color: rgba(0,0,0,0.07);
        }

        /* ── Glass surface shared ── */
        .glass-btn {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(255,255,255,0.95);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            0 0 0 0.5px rgba(0,0,0,0.055),
            0 1px 2px rgba(0,0,0,0.055),
            0 4px 14px rgba(0,0,0,0.065);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition:
            transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.14s ease,
            background 0.12s ease;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          border-radius: 14px;
        }
        .glass-btn:active {
          transform: scale(0.89) !important;
          box-shadow: 0 0 0 0.5px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.07) !important;
          background: rgba(238,238,244,0.97) !important;
        }

        /* ── Menu button ── */
        .hdr-menu {
          pointer-events: auto;
          width: 44px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 5.5px;
          padding: 0 12px;
          border: none;
        }
        .hdr-bar {
          height: 1.75px;
          border-radius: 99px;
          background: #18181b;
        }
        .hdr-bar:nth-child(1) { width: 20px; }
        .hdr-bar:nth-child(2) { width: 14px; }
        .hdr-bar:nth-child(3) { width: 18px; }

        /* ── History button ── */
        .hdr-history {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 14px 0 11px;
          height: 40px;
          border-radius: 50px !important;
          border: none;
        }
        .hdr-history-text {
          font-family: 'Geist', -apple-system, 'SF Pro Display', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #18181b;
          line-height: 1;
        }
        .hdr-clock { color: #9ca3af; display: flex; align-items: center; }
        .hdr-chev  { color: #c4c4cf; display: flex; align-items: center; margin-top: 0.5px; }

        /* ── Discover button — hero piece ── */
        .hdr-discover {
          pointer-events: auto;
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: none;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow:
            0 0 0 0.5px rgba(109,40,217,0.25),
            0 2px 5px rgba(0,0,0,0.12),
            0 8px 24px rgba(109,40,217,0.28);
          transition:
            transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.14s ease;
        }
        .hdr-discover:active {
          transform: scale(0.88);
          box-shadow: 0 0 0 0.5px rgba(109,40,217,0.15), 0 1px 4px rgba(0,0,0,0.10);
        }
        .disc-grad {
          position: absolute;
          inset: 0;
          background: linear-gradient(148deg,
            #8b5cf6 0%,
            #a855f7 30%,
            #c084fc 58%,
            #e879f9 85%,
            #f472b6 100%
          );
        }
        /* animated shimmer */
        @keyframes shimmer {
          0%   { transform: translateX(-100%) rotate(20deg); }
          100% { transform: translateX(200%)  rotate(20deg); }
        }
        .disc-shimmer {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .disc-shimmer::after {
          content: '';
          position: absolute;
          top: -40%;
          left: -60%;
          width: 40%;
          height: 180%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
        /* icon */
        .disc-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* NEW chip */
        .disc-chip {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: rgba(255,255,255,0.20);
          border: 0.5px solid rgba(255,255,255,0.35);
          border-radius: 5px;
          padding: 1.5px 4px;
          font-family: 'Geist', -apple-system, sans-serif;
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.95);
          line-height: 1.5;
        }
        /* soft pulse ring */
        @keyframes disc-pulse {
          0%,100% { opacity: 0; transform: scale(0.7); }
          50%      { opacity: 0.35; transform: scale(1.15); }
        }
        .disc-ring {
          position: absolute;
          inset: 3px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.45);
          animation: disc-pulse 3s ease-in-out infinite;
        }
      `}</style>

      <header className={`hdr${scrolled ? ' scrolled' : ''}`}>

        {/* ── Left: Menu ── */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menu"
          className="hdr-menu glass-btn"
        >
          <span className="hdr-bar" />
          <span className="hdr-bar" />
          <span className="hdr-bar" />
        </button>

        {/* ── Center: History ── */}
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="Chat history"
          className="hdr-history glass-btn"
        >
          <span className="hdr-clock">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.3"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="hdr-history-text">History</span>
          <span className="hdr-chev">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.7"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* ── Right: Discover ── */}
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Discover"
          className="hdr-discover"
        >
          <div className="disc-grad" />
          <div className="disc-shimmer" />
          <div className="disc-ring" />
          <div className="disc-icon">
            {/* compass needle icon */}
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9.5"
                stroke="rgba(255,255,255,0.30)" strokeWidth="1.2" />
              <polygon
                points="12,4.5 14.2,11.5 12,13.5 9.8,11.5"
                fill="white" opacity="0.95" />
              <polygon
                points="12,19.5 14.2,12.5 12,10.5 9.8,12.5"
                fill="rgba(255,255,255,0.40)" />
              <circle cx="12" cy="12" r="1.3" fill="white" opacity="0.95" />
            </svg>
          </div>
          <div className="disc-chip">DISC</div>
        </button>

      </header>
    </>
  );
};

export default Header;
        
