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
  const [historyPressed, setHistoryPressed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');

        .askgpt-header {
          position: absolute;
          inset-inline: 0;
          top: 0;
          z-index: 30;
          height: 76px;
          padding: 0 14px;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Sidebar button ── */
        .askgpt-sidebar-btn {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .askgpt-sidebar-btn:active {
          transform: scale(0.93);
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          background: rgba(245,245,247,0.97);
        }
        .askgpt-sidebar-btn .bar {
          position: absolute;
          left: 11px;
          width: 22px;
          height: 1.8px;
          border-radius: 99px;
          background: #1a1a2e;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .askgpt-sidebar-btn .bar-1 { top: 14px; width: 22px; }
        .askgpt-sidebar-btn .bar-2 { top: 20px; width: 16px; }
        .askgpt-sidebar-btn .bar-3 { top: 26px; width: 20px; }

        /* ── Center History button ── */
        .askgpt-history-btn {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 9px 16px 9px 14px;
          border-radius: 50px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .askgpt-history-btn:active {
          transform: scale(0.96);
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .askgpt-history-label {
          font-family: 'Manrope', -apple-system, sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #111827;
          line-height: 1;
        }
        .askgpt-history-chevron {
          display: flex;
          align-items: center;
          color: #9ca3af;
          margin-top: 1px;
        }

        /* ── Discover button ── */
        .askgpt-discover-btn {
          pointer-events: auto;
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          border: none;
          padding: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.12);
          -webkit-tap-highlight-color: transparent;
        }
        .askgpt-discover-btn:active {
          transform: scale(0.92);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .askgpt-discover-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .askgpt-discover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%);
        }
        .askgpt-discover-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 18px;
          height: 18px;
          border-radius: 6px;
          background: rgba(255,255,255,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        /* scrolled: subtle frosted strip */
        .askgpt-header.scrolled::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(249,249,251,0.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: -1;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
      `}</style>

      <header className={`askgpt-header${scrolled ? ' scrolled' : ''}`}>

        {/* ── Left: Sidebar toggle ── */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="askgpt-sidebar-btn"
        >
          <span className="bar bar-1" />
          <span className="bar bar-2" />
          <span className="bar bar-3" />
        </button>

        {/* ── Center: History ── */}
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="Chat history"
          className="askgpt-history-btn"
          onMouseDown={() => setHistoryPressed(true)}
          onMouseUp={() => setHistoryPressed(false)}
          onTouchStart={() => setHistoryPressed(true)}
          onTouchEnd={() => setHistoryPressed(false)}
        >
          {/* tiny clock icon */}
          <svg
            width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="#6b7280" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 15.5" />
          </svg>
          <span className="askgpt-history-label">History</span>
          {/* chevron down */}
          <span className="askgpt-history-chevron">
            <svg
              width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* ── Right: Discover ── */}
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Open Discover"
          className="askgpt-discover-btn"
        >
          <img
            className="askgpt-discover-img"
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&auto=format&fit=crop"
            alt=""
            draggable={false}
          />
          <div className="askgpt-discover-overlay" />
          <div className="askgpt-discover-badge">📰</div>
        </button>

      </header>
    </>
  );
};

export default Header;
      
