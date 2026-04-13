import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearCurrentConversations } from '../utils/storage';

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

const ExportIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v11" />
    <path d="M8 10l4 4 4-4" />
    <path d="M5 21h14" />
  </svg>
);

const ArchiveIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="5" rx="1.5" />
    <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
    <path d="M10 13h4" />
  </svg>
);

const HistoryIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const ClearIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const DeleteAccountIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="M18 8l4 4" />
    <path d="M22 8l-4 4" />
  </svg>
);

const rowBase =
  'w-full bg-[#f7f7f8] px-4 py-3 text-left dark:bg-[#17171a]';

const DataControlsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
const [showClearSuccess, setShowClearSuccess] = useState(false);

  const openArchivedPage = () => {
    navigate('/history/archived');
  };

  const handleClearChatHistory = () => {
  clearCurrentConversations();
  setShowClearConfirm(false);
  setShowClearSuccess(true);

  window.setTimeout(() => {
    setShowClearSuccess(false);
  }, 3000);
};

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
          Data controls
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
              <div className="flex items-center gap-3">
                <IconWrap>
                  <ExportIcon />
                </IconWrap>
                <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Export Data
                </div>
              </div>
            </button>
          </div>

          <div>
            <div className="mb-2 px-2 text-[15px] font-medium text-[#7c7c82]">
              Chat history
            </div>

            <div className="space-y-[2px]">
              <button
  type="button"
  onClick={openArchivedPage}
  className={`${rowBase} rounded-t-[24px] rounded-b-[8px]`}
  style={{
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  }}
>
  <div className="flex items-center gap-3">
    <IconWrap>
      <ArchiveIcon />
    </IconWrap>
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
      View archived chats
    </div>
  </div>
</button>

              <button
  type="button"
  onClick={openArchivedPage}
  className={`${rowBase} rounded-t-[8px] rounded-b-[24px]`}
  style={{
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  }}
>
  <div className="flex items-center gap-3">
    <IconWrap>
      <HistoryIcon />
    </IconWrap>
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
      Archive chat history
    </div>
  </div>
</button>
            </div>
          </div>

          <div>
            <div className="space-y-[2px]">
              <button
  type="button"
  onClick={() => setShowClearConfirm(true)}
  className={`${rowBase} rounded-t-[24px] rounded-b-[8px]`}
  style={{
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  }}
>
  <div className="flex items-center gap-3">
    <span className="flex h-5 w-5 items-center justify-center text-[#ef4444]">
      <ClearIcon />
    </span>
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#ef4444]">
      Clear chat history
    </div>
  </div>
</button>

              <div className="px-4 pt-3 pb-4 text-[13px] leading-6 text-[#7c7c82]">
                This will remove your chat history from this device and it may
                not be available again after clearing.
              </div>

              <button
                type="button"
                className={`${rowBase} rounded-t-[8px] rounded-b-[24px]`}
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center text-[#ef4444]">
                    <DeleteAccountIcon />
                  </span>
                  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#ef4444]">
                    Delete ASK-GPT account
                  </div>
                </div>
              </button>
          {showClearConfirm ? (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    onClick={() => setShowClearConfirm(false)}
  >
    <div
      className="w-full max-w-[360px] rounded-[24px] bg-white px-5 py-5 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div
  className="text-center text-[20px] font-semibold tracking-[-0.02em] text-[#111111]"
  style={{
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  }}
>
  Delete chat history?
</div>

<div
  className="mt-3 text-center text-[14px] leading-6 text-[#6b7280]"
  style={{
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  }}
>
  All chats on this device will be deleted.
  <br />
  Archived chats will remain unchanged.
  <br />
  This action cannot be undone.
</div>

      <div className="mt-6 flex gap-3">
  <button
    type="button"
    onClick={() => setShowClearConfirm(false)}
    className="h-[50px] flex-1 rounded-full border border-[#e5e7eb] bg-white text-[15px] font-semibold text-[#111111]"
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
    }}
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleClearChatHistory}
    className="h-[50px] flex-1 rounded-full bg-[#dc2626] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.22)]"
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
    }}
  >
    Delete
  </button>
</div>
    </div>
  </div>
) : null}
              {showClearSuccess ? (
  <div className="fixed inset-x-4 bottom-6 z-50 mx-auto w-full max-w-[430px] rounded-[20px] bg-[#111111] px-4 py-4 shadow-xl">
    <div className="grid grid-cols-[32px_1fr_32px] items-center">
      <div />

      <div
        className="text-center text-[15px] font-medium text-white"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        Successfully cleared chat history.
      </div>

      <button
        type="button"
        onClick={() => setShowClearSuccess(false)}
        className="flex h-8 w-8 items-center justify-center text-[28px] leading-none text-white"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        ×
      </button>
    </div>
  </div>
) : null}
              <div className="px-4 pt-3 text-[13px] leading-6 text-[#7c7c82]">
                Deleting your ASK-GPT account is permanent. After deletion, you
                may not be able to recover your chats, settings, or saved data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataControlsPage;
