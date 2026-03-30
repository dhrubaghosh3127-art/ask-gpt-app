import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IconWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex h-5 w-5 items-center justify-center text-[#111111] dark:text-white">
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

const BugIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 9V7a4 4 0 1 1 8 0v2" />
    <path d="M6 10h12v5a6 6 0 0 1-12 0v-5Z" />
    <path d="M4 13H2" />
    <path d="M22 13h-2" />
    <path d="M5 8 3.5 6.5" />
    <path d="M19 8l1.5-1.5" />
    <path d="M8 18l-1.5 2" />
    <path d="M16 18l1.5 2" />
  </svg>
);

const MailIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const rowBase =
  'w-full rounded-[24px] bg-[#f7f7f8] px-4 py-4 text-left dark:bg-[#17171a]';

const ReportBugPage: React.FC = () => {
  const navigate = useNavigate();
  const [bugText, setBugText] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim());
  }, [userEmail]);

  const canSubmit = bugText.trim().length > 0 && isEmailValid;

  return (
    <div className="min-h-screen bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111] dark:bg-[#17171a] dark:text-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          <ArrowLeftIcon />
        </button>

        <div className="mb-8 text-center text-[30px] font-bold tracking-[-0.03em] text-[#111111] dark:text-white">
          Report bug
        </div>

        <div className="mb-3 text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
          What happened?
        </div>

        <div className={rowBase}>
          <div className="mb-3 flex items-center gap-3">
            <IconWrap>
              <BugIcon />
            </IconWrap>
          </div>

          <textarea
            value={bugText}
            onChange={(e) => setBugText(e.target.value.slice(0, 2000))}
            placeholder="Tell us about the issue you encountered"
            className="min-h-[170px] w-full resize-none bg-transparent text-[16px] leading-7 text-[#111111] outline-none placeholder:text-[#8c8c91] dark:text-white dark:placeholder:text-[#8c8c91]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          />

          <div className="mt-2 text-right text-[13px] text-[#7c7c82]">
            {bugText.length} / 2000
          </div>
        </div>

        <div className="mt-5 mb-3 text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
          Your mail
        </div>

        <div className={rowBase}>
          <div className="flex items-center gap-3">
            <IconWrap>
              <MailIcon />
            </IconWrap>

            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="example@Gmail.com"
              className="w-full bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#8c8c91] dark:text-white dark:placeholder:text-[#8c8c91]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          className={`mt-6 h-[56px] w-full rounded-full text-[17px] font-semibold transition-all ${
            canSubmit
              ? 'bg-[#111111] text-white'
              : 'bg-[#e5e5e5] text-[#a3a3a3] dark:bg-[#2a2a2d] dark:text-[#7c7c82]'
          }`}
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ReportBugPage;
