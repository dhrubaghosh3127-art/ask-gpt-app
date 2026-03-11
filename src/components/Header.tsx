import React from 'react';
// import { MODELS } from '../constants';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-4">
      <div className="pointer-events-auto flex items-center gap-3">
        <button
  type="button"
  onClick={toggleSidebar}
  className="h-14 w-14 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-[#edf4ff] to-[#eef0ff] dark:from-[#111827] dark:via-[#172033] dark:to-[#221933] shadow-[0_10px_26px_rgba(99,102,241,0.14)] backdrop-blur-xl flex items-center justify-center text-gray-700 dark:text-white"
>
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>
        
        <button
  type="button"
  className="relative h-14 min-w-[148px] px-5 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-[#edf4ff] to-[#eef0ff] dark:from-[#111827] dark:via-[#172033] dark:to-[#221933] shadow-[0_10px_26px_rgba(99,102,241,0.14)] backdrop-blur-xl flex items-center justify-center gap-2 overflow-hidden"
>
  <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_82%_28%,rgba(96,165,250,0.10),transparent_28%),radial-gradient(circle_at_60%_100%,rgba(167,139,250,0.12),transparent_34%)]" />
  <span className="relative text-[15px] font-semibold tracking-[-0.01em] text-gray-900 dark:text-white">
    Profile
  </span>
  <span className="relative text-gray-500 dark:text-gray-300 text-xs">▾</span>
</button>
      </div>
      
      <div className="pointer-events-auto flex items-center gap-3">
  <div className="h-14 w-14 rounded-[22px] border border-white/70 dark:border-white/10 bg-gradient-to-br from-[#edf6ff] via-[#edf4ff] to-[#eef0ff] dark:from-[#111827] dark:via-[#172033] dark:to-[#221933] shadow-[0_10px_26px_rgba(99,102,241,0.14)] backdrop-blur-xl flex items-center justify-center text-[15px] font-semibold text-gray-900 dark:text-white">
    AI
  </div>
</div>
    </header>
  );
};

export default Header;
        
