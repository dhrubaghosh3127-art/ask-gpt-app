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
    className="h-[48px] w-[210px] rounded-[18px] bg-[#f4f3f8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-3 px-[14px]"
  >
    <span className="flex h-5 w-5 items-center justify-center text-[#4b5563]">
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7h16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 12h16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 17h16" />
      </svg>
    </span>

    <span className="flex-1 truncate text-left text-[14px] font-medium tracking-[-0.01em] text-[#374151]">
      All chat history
    </span>

    <span className="text-[#6b7280]">
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        
