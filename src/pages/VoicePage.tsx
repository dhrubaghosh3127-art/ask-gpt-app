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
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const VoiceWaveIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 10v4" />
    <path d="M8 7v10" />
    <path d="M12 5v14" />
    <path d="M16 7v10" />
    <path d="M20 10v4" />
  </svg>
);

const GlobeIcon = () => (
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
    <path d="M12 3c2.8 3 4.2 6 4.2 9s-1.4 6-4.2 9c-2.8-3-4.2-6-4.2-9s1.4-6 4.2-9Z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const rowBase =
  'w-full rounded-[24px] bg-[#f7f7f8] px-4 py-4 text-left dark:bg-[#17171a]';

const languageOptions = [
  'Auto-Detect',
  'English',
  'Bangla',
  'Hindi',
  'Arabic',
  'Urdu',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Russian',
  'Turkish',
  'Chinese',
  'Japanese',
  'Korean',
  'Italian',
  'Thai',
  'Vietnamese',
];

const VoicePage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedIntelligence, setSelectedIntelligence] = useState<
  'Standard' | 'Advanced'
>(() => {
  if (typeof window === 'undefined') return 'Advanced';
  return localStorage.getItem('voice_intelligence') === 'standard'
    ? 'Standard'
    : 'Advanced';
});
  const [selectedLanguage, setSelectedLanguage] =
    useState('Auto-Detect');

  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          <ArrowLeftIcon />
        </button>

        <div className="mb-8 text-center text-[30px] font-bold tracking-[-0.03em] text-[#111111]">
          Voice
        </div>

        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setIntelligenceOpen(true)}
            className={rowBase}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconWrap>
                  <VoiceWaveIcon />
                </IconWrap>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">
                    Intelligence
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#7c7c82]">
                    {selectedIntelligence}
                  </div>
                </div>
              </div>

              <IconWrap>
                <ChevronDownIcon />
              </IconWrap>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLanguageOpen(true)}
            className={rowBase}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconWrap>
                  <GlobeIcon />
                </IconWrap>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">
                    Input language
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#7c7c82]">
                    {selectedLanguage}
                  </div>
                </div>
              </div>

              <IconWrap>
                <ChevronDownIcon />
              </IconWrap>
            </div>
          </button>
        </div>
      </div>

      {intelligenceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setIntelligenceOpen(false)}
        >
          <div
            className="w-full max-w-[260px] rounded-[28px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            {(['Standard', 'Advanced'] as const).map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => {
  setSelectedIntelligence(item);
  localStorage.setItem(
    'voice_intelligence',
    item === 'Standard' ? 'standard' : 'advanced'
  );
  setIntelligenceOpen(false);
}}
                className={`flex w-full items-center justify-between px-4 py-4 text-left ${
                  index === 0 ? 'rounded-t-[20px]' : 'rounded-b-[20px]'
                }`}
              >
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                  {item}
                </span>
                {selectedIntelligence === item && (
                  <span className="text-[28px] leading-none text-[#111111]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {languageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setLanguageOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-[28px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="max-h-[420px] overflow-y-auto">
              {languageOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(item);
                    setLanguageOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                    {item}
                  </span>
                  {selectedLanguage === item && (
                    <span className="text-[28px] leading-none text-[#111111]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoicePage;
