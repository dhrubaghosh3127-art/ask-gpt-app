import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { MODELS } from '../constants';

interface HeaderProps {
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, selectedModel, setSelectedModel }) => {
  const navigate = useNavigate();
  return (
  <header className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[84px] px-4 pt-4">
    <div className="pointer-events-auto absolute left-4 top-4">
      <button
        type="button"
        onClick={toggleSidebar}
        className="h-[46px] w-[46px] rounded-[17px] bg-[#f3f2f8] shadow-[0_2px_8px_rgba(15,23,42,0.035)] flex items-center justify-center"
      >
        <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7h16" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 12h16" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 17h16" />
        </svg>
      </button>
    </div>

    <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2">
      <button
        type="button"
onClick={() => navigate('/history')}
        className="h-[46px] w-[176px] rounded-[17px] bg-[#f3f2f8] shadow-[0_2px_8px_rgba(15,23,42,0.035)] flex items-center justify-center px-[16px] relative"
      >
        <span
          className="truncate text-center text-[14px] font-semibold tracking-[-0.02em] text-[#3a3a3c]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          CHAT HISTORY
        </span>

        <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6b7280]">
          <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
    </div>

<div className="pointer-events-auto absolute right-4 top-4">
  <button
    type="button"
    onClick={() => {}}
    aria-label="Open Discover"
    className="relative h-[46px] w-[46px] overflow-hidden rounded-[17px] bg-[#f3f2f8] shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-[0.96] transition-transform"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&auto=format&fit=crop')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="absolute inset-0 bg-black/10" />

    <div className="absolute bottom-[4px] right-[4px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-white/95 text-[11px] shadow-sm">
      📰
    </div>
  </button>
</div>
  </header>
);
};

export default Header;
        
