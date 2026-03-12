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
  className="h-[46px] w-[196px] rounded-[17px] bg-[#f3f2f8] shadow-[0_2px_8px_rgba(15,23,42,0.035)] flex items-center justify-center px-[16px] relative"
>
  <span
    className="truncate text-center text-[14px] font-semibold tracking-[-0.02em] text-[#3a3a3c]"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    ALL CHAT HISTORY
  </span>

  <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6b7280]">
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        
