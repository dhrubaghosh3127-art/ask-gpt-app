import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/i18n';

const IconWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex h-5 w-5 items-center justify-center text-[#111111]">
    {children}
  </span>
);

const ArrowLeftIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);
const SunIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C7 3 3 6.6 3 11.2 3 15 6.1 18 10 18h1.2c.9 0 1.6.7 1.6 1.6 0 .8.7 1.4 1.5 1.4 3.8 0 6.7-3.5 6.7-7.8C21 7.4 17 3 12 3Z" />
    <circle cx="7.5" cy="11" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="14" cy="8" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="11" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const GearIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
  </svg>
);

const BellIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const VoiceIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M8 8v8" />
    <path d="M16 8v8" />
    <path d="M4 10v4" />
    <path d="M20 10v4" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="7" ry="3" />
    <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
    <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  </svg>
);

const BugIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 9a4 4 0 1 1 8 0v7a4 4 0 1 1-8 0V9Z" />
    <path d="M9 4l1.5 2M15 4l-1.5 2M4 13h4M16 13h4M5 8l3 2M19 8l-3 2M5 18l3-2M19 18l-3-2" />
  </svg>
);

const InfoIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10v6" />
    <path d="M12 7h.01" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h-5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
    <path d="M10 12h11" />
    <path d="M18 7l5 5-5 5" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const SystemModeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);
const rowBase =
  'w-full bg-[#f7f7f8] px-4 py-3 text-left dark:bg-[#17171a]';

const SettingsPage: React.FC<{ isDarkMode: boolean; setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
const [appearanceOpen, setAppearanceOpen] = useState(false);
const [appearanceMode, setAppearanceMode] = useState<'system' | 'light' | 'dark'>('system');
const [accentOpen, setAccentOpen] = useState(false);
const [accentColor, setAccentColor] = useState<'default' | 'blue' | 'green' | 'yellow' | 'pink' | 'orange' | 'purple'>(() => {
  const saved = localStorage.getItem('accentColor');
  return (saved as 'default' | 'blue' | 'green' | 'yellow' | 'pink' | 'orange' | 'purple') || 'default';
});
  useEffect(() => {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldDark = appearanceMode === 'dark' || (appearanceMode === 'system' && systemDark);

  root.classList.toggle('dark', shouldDark);
}, [appearanceMode]);
  useEffect(() => {
  localStorage.setItem('accentColor', accentColor);
}, [accentColor]);
  useEffect(() => {
  const root = document.documentElement;

  const palette = {
    default: {
      bubble: '#bfdbfe',
      send: '#111111',
      caret: '#111111',
    },
    blue: {
      bubble: '#bfdbfe',
      send: '#2563eb',
      caret: '#2563eb',
    },
    green: {
      bubble: '#bbf7d0',
      send: '#16a34a',
      caret: '#16a34a',
    },
    yellow: {
      bubble: '#fef08a',
      send: '#eab308',
      caret: '#eab308',
    },
    pink: {
      bubble: '#fbcfe8',
      send: '#ec4899',
      caret: '#ec4899',
    },
    orange: {
      bubble: '#fed7aa',
      send: '#f97316',
      caret: '#f97316',
    },
    purple: {
      bubble: '#ddd6fe',
      send: '#8b5cf6',
      caret: '#8b5cf6',
    },
  } as const;

  const current = palette[accentColor];

  root.style.setProperty('--accent-user-bubble', current.bubble);
  root.style.setProperty('--accent-send-button', current.send);
  root.style.setProperty('--accent-caret', current.caret);
}, [accentColor]);
  const items = [
  { key: 'general', icon: <GearIcon />, label: t('general', 'General') },
  { key: 'notifications', icon: <BellIcon />, label: t('notifications', 'Notifications') },
  { key: 'voice', icon: <VoiceIcon />, label: t('voice', 'Voice') },
  { key: 'data_controls', icon: <DatabaseIcon />, label: t('data_controls', 'Data controls') },
  { key: 'security', icon: <ShieldIcon />, label: t('security', 'Security') },
  { key: 'report_bug', icon: <BugIcon />, label: t('report_bug', 'Report bug') },
  { key: 'about', icon: <InfoIcon />, label: t('about', 'About') },
];

  return (
    <div className="min-h-screen bg-white text-[#111111] dark:bg-[#0b0b0c] dark:text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          <ArrowLeftIcon />
        </button>

        <div className="space-y-5">
          <div className="space-y-[2px]">
            <button
  type="button"
  onClick={() => setAppearanceOpen(true)}
  className={`${rowBase} rounded-t-[24px] rounded-b-[8px]`}
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
              <div className="flex items-center gap-3">
                <IconWrap><SunIcon /></IconWrap>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">{t('appearance', 'Appearance')}</div>
<div className="mt-0.5 text-[12px] text-[#7c7c82]">{appearanceMode === 'system' ? `System (${t('default', 'Default')})` : appearanceMode === 'light' ? 'Light' : 'Dark'}</div>
                </div>
              </div>
            </button>
{appearanceOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    onClick={() => setAppearanceOpen(false)}
  >
    <div
      className="w-full max-w-[430px] rounded-[28px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
      onClick={(e) => e.stopPropagation()}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      <div className="px-2 pb-3 text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
        Appearance
      </div>

      <div className="space-y-[2px]">
        <button
          type="button"
          onClick={() => {
            setAppearanceMode('system');
            setAppearanceOpen(false);
          }}
          className={`${rowBase} rounded-t-[24px] rounded-b-[8px]`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconWrap><SystemModeIcon /></IconWrap>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em]">System (Default)</div>
                <div className="mt-0.5 text-[12px] text-[#7c7c82]">Follow device theme</div>
              </div>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 ${appearanceMode === 'system' ? 'border-[#111111] bg-[#111111]' : 'border-[#d1d1d6] bg-transparent'}`} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setAppearanceMode('light');
            setAppearanceOpen(false);
          }}
          className={`${rowBase} rounded-t-[8px] rounded-b-[8px]`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconWrap><SunIcon /></IconWrap>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em]">Light</div>
                <div className="mt-0.5 text-[12px] text-[#7c7c82]">Always use light mode</div>
              </div>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 ${appearanceMode === 'light' ? 'border-[#111111] bg-[#111111]' : 'border-[#d1d1d6] bg-transparent'}`} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
  setAppearanceMode('dark');
  setIsDarkMode(true);
  setAppearanceOpen(false);
}}
          className={`${rowBase} rounded-t-[8px] rounded-b-[24px]`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconWrap><MoonIcon /></IconWrap>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em]">Dark</div>
                <div className="mt-0.5 text-[12px] text-[#7c7c82]">Always use dark mode</div>
              </div>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 ${appearanceMode === 'dark' ? 'border-[#111111] bg-[#111111]' : 'border-[#d1d1d6] bg-transparent'}`} />
          </div>
        </button>
      </div>
    </div>
  </div>
)}
            <button
  type="button"
  onClick={() => setAccentOpen((v) => !v)}
  className={`${rowBase} rounded-t-[8px] rounded-b-[24px]`}
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconWrap><PaletteIcon /></IconWrap>
                  <div>
                    <div className="text-[15px] font-semibold tracking-[-0.02em]">{t('accent_color', 'Accent color')}</div>
<div className="mt-0.5 text-[12px] text-[#7c7c82]">{t('default', 'Default')}</div>
                  </div>
                </div>
                <IconWrap><ChevronDownIcon /></IconWrap>
              </div>
            </button>
          </div>
{accentOpen && (
  <div
    className="fixed inset-0 z-50"
    onClick={() => setAccentOpen(false)}
  >
 <div className="flex h-full items-center justify-end px-4">
  <div
    className="w-[250px] rounded-[28px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
    onClick={(e) => e.stopPropagation()}
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
        <button
          type="button"
          onClick={() => { setAccentColor('default'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#9b9b9b]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Default</span>
          </div>
          {accentColor === 'default' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('blue'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#2196f3]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Blue</span>
          </div>
          {accentColor === 'blue' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('green'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#13b94a]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Green</span>
          </div>
          {accentColor === 'green' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('yellow'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#f4c400]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Yellow</span>
          </div>
          {accentColor === 'yellow' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('pink'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#f06292]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Pink</span>
          </div>
          {accentColor === 'pink' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('orange'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#ff6d1f]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Orange</span>
          </div>
          {accentColor === 'orange' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => { setAccentColor('purple'); setAccentOpen(false); }}
          className="flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#8e4de8]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Purple · Plus</span>
          </div>
          {accentColor === 'purple' && <span className="text-[28px] leading-none text-[#111111]">✓</span>}
        </button>
      </div>
    </div>
  </div>
)}
          <div className="space-y-[2px]">
            {items.map((item, index) => (
              <button
  key={item.label}
  type="button"
  onClick={() => {
  if (item.key === 'general') navigate('/general');
  if (item.key === 'notifications') navigate('/notifications');
}}
  className={`${rowBase} ${
    index === 0 ? 'rounded-t-[24px] rounded-b-[8px]' : ''
  } ${
    index > 0 && index < items.length - 1 ? 'rounded-[8px]' : ''
  } ${
    index === items.length - 1 ? 'rounded-t-[8px] rounded-b-[24px]' : ''
  }`}
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  <div className="flex items-center gap-3">
    <IconWrap>{item.icon}</IconWrap>
    <div className="text-[15px] font-semibold tracking-[-0.02em]">{item.label}</div>
  </div>
</button>
            ))}
          </div>

          <button
            type="button"
            className="w-full rounded-[24px] bg-[#f7f7f8] px-4 py-3 text-left"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="flex items-center gap-3 text-[#ef4444]">
              <IconWrap><LogoutIcon /></IconWrap>
              <div className="text-[15px] font-semibold tracking-[-0.02em]">{t('log_out', 'Log out')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage
