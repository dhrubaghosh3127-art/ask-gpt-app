import React from 'react';
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

const HelpIcon = () => (
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
    <path d="M9.6 9a2.6 2.6 0 1 1 4.7 1.5c-.6.8-1.5 1.2-2.1 1.8-.4.4-.7.9-.7 1.7" />
    <path d="M12 17h.01" />
  </svg>
);

const TermsIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h4" />
  </svg>
);

const PrivacyIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l7 4v5c0 4.5-2.7 7.8-7 9-4.3-1.2-7-4.5-7-9V7l7-4z" />
    <path d="M9.5 12.5l1.7 1.7 3.3-3.7" />
  </svg>
);

const VersionIcon = () => (
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
    <path d="M12 8h.01" />
    <path d="M11 12h1v4h1" />
  </svg>
);

type RowCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
};

const RowCard: React.FC<RowCardProps> = ({ icon, title, subtitle }) => (
  <button
    type="button"
    className="w-full rounded-[24px] bg-[#f7f7f8] px-4 py-3 text-left"
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
    }}
  >
    <div className="flex items-center gap-3">
      <div className="flex h-[24px] w-[24px] items-center justify-center text-[#111111]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
          {title}
        </div>

        {subtitle ? (
          <div className="mt-0.5 text-[12px] text-[#7c7c82]">{subtitle}</div>
        ) : null}
      </div>
    </div>
  </button>
);

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-4 pb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          <ArrowLeftIcon />
        </button>

        <div className="mb-8 text-center">
          <h1
            className="text-[30px] font-bold tracking-[-0.03em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            About
          </h1>
        </div>

        <div className="space-y-[12px]">
          <RowCard icon={<IconWrap><HelpIcon /></IconWrap>} title="Help center" />
          <RowCard icon={<IconWrap><TermsIcon /></IconWrap>} title="Terms of use" />
          <RowCard icon={<IconWrap><PrivacyIcon /></IconWrap>} title="Privacy policy" />
          <RowCard
            icon={<IconWrap><VersionIcon /></IconWrap>}
            title="ASK-GPT version"
            subtitle="Web version"
          />
        </div>

        <div className="mt-auto pt-8 text-center">
          <div
            className="text-[13px] font-medium tracking-[-0.02em] text-[#7c7c82]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            From
          </div>

          <div
            className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            ANIL GHOSH PROHOR
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
