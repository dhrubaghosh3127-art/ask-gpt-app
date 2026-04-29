import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IconWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex h-5 w-5 items-center justify-center text-[#111111]">
    {children}
  </span>
);

const ArrowLeftIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 19l-7-7 7-7" />
    <path d="M8 12h12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const LanguageIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18" />
    <path d="M12 3a15 15 0 0 0 0 18" />
  </svg>
);

const ResponseStyleIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <path d="M8 10h8" />
    <path d="M8 14h5" />
  </svg>
);

const ToneIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M9 10h.01" />
    <path d="M15 10h.01" />
    <path d="M9 15c.8.8 1.8 1.2 3 1.2s2.2-.4 3-1.2" />
  </svg>
);

const DefaultModeIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v18" />
    <path d="M3 12h18" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const CustomInstructionIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5V16l9.5-9.5 3.5 3.5L7.5 19.5H4Z" />
    <path d="M13.5 6.5 17 10" />
  </svg>
);

const MemoryIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const FontSizeIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 18 10 6l4 12" />
    <path d="M7.5 14h5" />
    <path d="M15 18h5" />
    <path d="M17.5 18V9" />
  </svg>
);

const rowBase =
  'w-full rounded-[24px] bg-[#f7f7f8] px-4 py-4 text-left';

const PersonalizationRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  value?: string;
  onClick?: () => void;
}> = ({ icon, title, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={rowBase}
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <IconWrap>{icon}</IconWrap>
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[#7c7c82]">
        {value ? (
          <span className="text-[14px] font-medium">{value}</span>
        ) : null}
        <ChevronRightIcon />
      </div>
    </div>
  </button>
);

const PersonalizationPage: React.FC = () => {
  const navigate = useNavigate();
const [defaultModeOpen, setDefaultModeOpen] = useState(false);
  const [defaultMode, setDefaultMode] = useState<'Auto' | 'Thinking' | 'Fast'>(() => {
    const saved = localStorage.getItem('askgpt_default_mode');
    return saved === 'Auto' || saved === 'Thinking' || saved === 'Fast' ? saved : 'Auto';
  });

  const selectDefaultMode = (mode: 'Auto' | 'Thinking' | 'Fast') => {
    setDefaultMode(mode);
    localStorage.setItem('askgpt_default_mode', mode);
    setDefaultModeOpen(false);
  };
  return (
    <div className="h-[100dvh] overflow-hidden bg-white text-[#111111]">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col px-4 pt-4 pb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          <ArrowLeftIcon />
        </button>

        <div
          className="mb-6 text-center text-[30px] font-bold tracking-[-0.03em] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Personalization
        </div>

        <div className="space-y-[2px]">
          <PersonalizationRow
  icon={<LanguageIcon />}
  title="Language"
  value="English"
  onClick={() => navigate('/general')}
/>
          <PersonalizationRow
            icon={<ResponseStyleIcon />}
            title="Response Style"
            value="Balanced"
          />
          <PersonalizationRow
            icon={<ToneIcon />}
            title="Tone"
            value="Friendly"
          />
        </div>

        <div className="mt-5 space-y-[2px]">
          <PersonalizationRow
  icon={<DefaultModeIcon />}
  title="Default Mode"
  value={defaultMode}
  onClick={() => setDefaultModeOpen(true)}
/>
          <PersonalizationRow
            icon={<CustomInstructionIcon />}
            title="Custom Instruction"
            value="Set"
          />
          <PersonalizationRow
            icon={<MemoryIcon />}
            title="Memory"
            value="On"
          />
        </div>

        <div className="mt-5">
          <PersonalizationRow
            icon={<FontSizeIcon />}
            title="Font Size"
            value="Medium"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalizationPage;
