import React from 'react';
// import { MODELS } from '../constants';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
      <div className="flex items-center gap-4">
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
  className="h-14 min-w-[220px] px-6 rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-[0_8px_24px_rgba(15,23,42,0.08)] flex items-center justify-center gap-2 text-[18px] font-semibold text-gray-900 dark:text-white"
>
  <span>Profile</span>
  <span className="text-gray-500 text-base">▾</span>
</button>
      </div>
      
      <div className="flex items-center gap-3">
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
        
