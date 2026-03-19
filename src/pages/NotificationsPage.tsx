import React, { useEffect, useState } from 'react';
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

const BellIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
  </svg>
);

const ReplyIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 17l-5-5 5-5" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const SoundIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

const VibrateIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="4" width="10" height="16" rx="2" />
    <path d="M11 17h2" />
    <path d="M3 8v8" />
    <path d="M21 8v8" />
    <path d="M1 10v4" />
    <path d="M23 10v4" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
    <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
  </svg>
);

const EyeIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const rowBase =
  'w-full bg-[#f7f7f8] px-4 py-3 text-left dark:bg-[#17171a]';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
const [allNotifications, setAllNotifications] = useState(() => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('notifications_all') !== 'off';
});
const [openSheet, setOpenSheet] = useState<null | 'all'>(
  null
);

useEffect(() => {
  localStorage.setItem('notifications_all', allNotifications ? 'on' : 'off');
}, [allNotifications]);

  const items = [
    {
      icon: <BellIcon />,
      label: 'All notifications',
      sub: 'Manage all app notifications',
    },
    {
      icon: <ReplyIcon />,
      label: 'Reply complete',
      sub: 'Get notified when answers are ready',
    },
    {
      icon: <SoundIcon />,
      label: 'Sound',
      sub: 'Play a sound for notifications',
    },
    {
      icon: <VibrateIcon />,
      label: 'Vibration',
      sub: 'Vibrate when notifications arrive',
    },
    {
      icon: <SparklesIcon />,
      label: 'Updates & new features',
      sub: 'Product news and important updates',
    },
    {
      icon: <EyeIcon />,
      label: 'Notification preview',
      sub: 'Choose how much content is shown',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          <ArrowLeftIcon />
        </button>

        <div className="space-y-5">
          <div className="px-1 text-[30px] font-bold tracking-[-0.03em] text-[#111111]">
            Notifications
          </div>

          <div className="space-y-[2px]">
            {items.map((item, index) => (
              <button
                key={item.label}
                type="button"
onClick={() => {
  if (index === 0) setOpenSheet('all');
}}
                className={`${rowBase} ${
                  index === 0 ? 'rounded-t-[24px] rounded-b-[8px]' : ''
                } ${
                  index > 0 && index < items.length - 1 ? 'rounded-[8px]' : ''
                } ${
                  index === items.length - 1
                    ? 'rounded-t-[8px] rounded-b-[24px]'
                    : ''
                }`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
              >
                <div className="flex items-center gap-3">
                  <IconWrap>{item.icon}</IconWrap>
                  <div>
                    <div className="text-[15px] font-semibold tracking-[-0.02em]">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#7c7c82]">
                      {item.sub}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {openSheet === 'all' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setOpenSheet(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-[28px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="px-2 pb-3 text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
              All notifications
            </div>

            <button
              type="button"
              onClick={() => setAllNotifications((v) => !v)}
              className="flex w-full items-center justify-between rounded-[20px] bg-[#f7f7f8] px-4 py-4 text-left"
            >
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                  Push
                </div>
                <div className="mt-0.5 text-[12px] text-[#7c7c82]">
                  Manage all app notifications
                </div>
              </div>

              <div
                className={`h-6 w-10 rounded-full transition-colors ${
                  allNotifications ? 'bg-[#111111]' : 'bg-[#d1d1d6]'
                }`}
              >
                <div
                  className={`mt-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
                    allNotifications ? 'translate-x-[18px]' : 'translate-x-[2px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
