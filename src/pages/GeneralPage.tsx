import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IconWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex h-6 w-6 items-center justify-center text-[#111111] dark:text-white">
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

const GlobeIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c3 3.2 3 14.8 0 18" />
    <path d="M12 3c-3 3.2-3 14.8 0 18" />
  </svg>
);

type AppLanguage =
  | 'default'
  | 'english'
  | 'bangla'
  | 'hindi'
  | 'urdu'
  | 'arabic'
  | 'spanish'
  | 'french'
  | 'german'
  | 'portuguese'
  | 'russian'
  | 'turkish'
  | 'indonesian'
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'italian'
  | 'thai'
  | 'vietnamese';

const languageOptions: Array<{ value: AppLanguage; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'english', label: 'English' },
  { value: 'bangla', label: 'বাংলা' },
  { value: 'hindi', label: 'हिन्दी' },
  { value: 'urdu', label: 'اردو' },
  { value: 'arabic', label: 'العربية' },
  { value: 'spanish', label: 'Español' },
  { value: 'french', label: 'Français' },
  { value: 'german', label: 'Deutsch' },
  { value: 'portuguese', label: 'Português' },
  { value: 'russian', label: 'Русский' },
  { value: 'turkish', label: 'Türkçe' },
  { value: 'indonesian', label: 'Bahasa Indonesia' },
  { value: 'chinese', label: '中文' },
  { value: 'japanese', label: '日本語' },
  { value: 'korean', label: '한국어' },
  { value: 'italian', label: 'Italiano' },
  { value: 'thai', label: 'ไทย' },
  { value: 'vietnamese', label: 'Tiếng Việt' },
];

const GeneralPage: React.FC = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('appLanguage') as AppLanguage | null;
    return saved || 'default';
  });

  const currentLabel = useMemo(() => {
    return languageOptions.find((item) => item.value === language)?.label || 'Default';
  }, [language]);

  return (
    <div
      className="bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white"
      style={{ minHeight: '100dvh' }}
    >
      <div className="mx-auto flex w-full max-w-[430px] flex-col px-4 pt-4 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111] dark:bg-[#17181a] dark:text-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          <ArrowLeftIcon />
        </button>

        <div
          className="mb-3 flex items-center justify-center gap-3"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          <IconWrap>
            <GlobeIcon />
          </IconWrap>
          <div className="text-[22px] font-bold tracking-[-0.03em]">Language</div>
        </div>

        <div
          className="overflow-hidden rounded-[30px] border border-[#e8e8ee] bg-white dark:border-[#232329] dark:bg-[#111214]"
          style={{
            minHeight: '0',
            maxHeight: 'calc(100dvh - 152px)',
          }}
        >
          <div className="flex max-h-[calc(100dvh-152px)] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {languageOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLanguage(item.value)}
                  className="flex w-full items-center gap-4 border-b border-[#ececf3] px-5 py-5 text-left last:border-b-0 dark:border-[#2a2b31]"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                  }}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                      language === item.value
                        ? 'border-[#111111] dark:border-white'
                        : 'border-[#8f8f95] dark:border-[#9b9ba1]'
                    }`}
                  >
                    {language === item.value ? (
                      <span className="h-4 w-4 rounded-full bg-[#111111] dark:bg-white" />
                    ) : null}
                  </span>

                  <span className="text-[14px] font-medium tracking-[-0.01em] text-[#111111] dark:text-white">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="shrink-0 border-t border-[#ececf3] bg-white px-5 py-4 dark:border-[#232329] dark:bg-[#111214]">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('appLanguage', language);
                  navigate(-1);
                }}
                className="ml-auto block text-[17px] font-semibold text-[#111111] dark:text-white"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-3 text-center text-[13px] text-[#6b7280] dark:text-[#a1a1aa]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Current: {currentLabel}
        </div>
      </div>
    </div>
  );
};

export default GeneralPage;
