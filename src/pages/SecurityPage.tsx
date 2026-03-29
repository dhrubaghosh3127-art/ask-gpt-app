import React from 'react';
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

const ChevronRightIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const PasskeyIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7.5" cy="12" r="3.5" />
    <path d="M11 12h10" />
    <path d="M17 12v3" />
    <path d="M20 12v2" />
  </svg>
);

const AuthenticatorIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2.5" width="14" height="19" rx="3" />
    <path d="M9 6h6" />
    <circle cx="12" cy="15" r="2.5" />
  </svg>
);

const PushNotificationIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M10 17a2 2 0 0 0 4 0" />
  </svg>
);

const rowBase =
  'w-full bg-[#f7f7f8] px-4 py-3 text-left dark:bg-[#17171a]';

const SecurityPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-5">
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
          Security
        </div>

        <div className="space-y-6">
          <div>
            <button
              type="button"
              className={`${rowBase} rounded-[24px]`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconWrap>
                    <PasskeyIcon />
                  </IconWrap>
                  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Passkeys
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#7c7c82]">
                  <span className="text-[15px] font-medium">Add</span>
                  <ChevronRightIcon />
                </div>
              </div>
            </button>
          </div>

          <div>
            <div className="mb-2 px-2 text-[15px] font-medium uppercase text-[#7c7c82]">
              Multi-factor authentication (MFA)
            </div>

            <div className="space-y-[2px]">
              <button
                type="button"
                className={`${rowBase} rounded-t-[24px] rounded-b-[8px]`}
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconWrap>
                      <AuthenticatorIcon />
                    </IconWrap>
                    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                      Authenticator app
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#7c7c82]">
                    <span className="text-[15px] font-medium">Off</span>
                    <ChevronRightIcon />
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`${rowBase} rounded-t-[8px] rounded-b-[24px]`}
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconWrap>
                      <PushNotificationIcon />
                    </IconWrap>
                    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                      Push notifications
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#7c7c82]">
                    <span className="text-[15px] font-medium">Off</span>
                    <ChevronRightIcon />
                  </div>
                </div>
              </button>
            </div>

            <div className="px-4 pt-3 text-[13px] leading-6 text-[#7c7c82]">
              Require an extra security challenge when logging in. If you are
              unable to pass this challenge, you may still have options to
              recover your account later.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
