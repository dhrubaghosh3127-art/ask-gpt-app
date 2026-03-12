import React from 'react';
// import { MODELS } from '../constants';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  return (
  <header className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[84px] px-4 pt-4">
    <div className="pointer-events-auto absolute left-4 top-4">
      <button
        type="button"
        onClick={toggleSidebar}
        className="h-14 w-14 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-white to-[#eef7ff] shadow-[0_10px_28px_rgba(125,160,220,0.16)] flex items-center justify-center"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2">
      <button
        type="button"
        className="relative h-14 min-w-[250px] px-5 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-white to-[#eef7ff] shadow-[0_10px_28px_rgba(125,160,220,0.16)] flex items-center gap-3"
      >
        <span className="absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(214,232,255,0.55),transparent_42%)]" />
        
        <span className="relative flex h-8 w-8 items-center justify-center text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 12h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 17h16" />
          </svg>
        </span>

        <span className="relative flex-1 text-left text-[15px] font-semibold tracking-[-0.01em] text-gray-900 dark:text-white whitespace-nowrap">
          ALL CHAT HISTORY
        </span>

        <span className="relative text-gray-500 dark:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
    </div>

    <div className="pointer-events-auto absolute right-4 top-4">
      <div className="h-14 w-14 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-white to-[#eef7ff] shadow-[0_10px_28px_rgba(125,160,220,0.16)] flex items-center justify-center">
        AI
      </div>
    </div>
  </header>
);
};

export default Header;
        
