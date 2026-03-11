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
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <button
  type="button"
  className="relative h-14 min-w-[228px] px-6 rounded-[22px] border border-white/60 dark:border-white/10 bg-gradient-to-br from-[#f8fbff] via-[#eef4ff] to-[#f3ecff] dark:from-[#111827] dark:via-[#172033] dark:to-[#221933] shadow-[0_10px_30px_rgba(99,102,241,0.16)] flex items-center justify-center gap-2 overflow-hidden backdrop-blur-xl"
>
  <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.14),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.12),transparent_38%)]" />
  <span className="relative text-[17px] font-semibold tracking-[-0.01em] text-gray-900 dark:text-white">
    Profile
  </span>
  <span className="relative text-gray-500 dark:text-gray-300 text-sm">▾</span>
</button>
      </div>
      
      <div className="pointer-events-auto flex items-center gap-3">
        <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
          <span className="text-green-500">●</span> Online
        </div>
        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          AI
        </div>
      </div>
    </header>
  );
};

export default Header;
        
