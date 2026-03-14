import React from 'react';
import { useNavigate } from 'react-router-dom';

const itemBase =
  'w-full rounded-[22px] bg-[#f7f7f8] px-5 py-5 text-left';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-5 pt-7 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#f7f7f8] text-[34px] leading-none"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          ←
        </button>

        <div className="space-y-6">
          <div className="space-y-[2px]">
            <button
              type="button"
              className={`${itemBase} rounded-t-[28px] rounded-b-[8px]`}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-[28px]">☀️</span>
                <div>
                  <div className="text-[17px] font-semibold tracking-[-0.02em]">Appearance</div>
                  <div className="mt-1 text-[14px] text-[#7c7c82]">System (Default)</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className={`${itemBase} rounded-t-[8px] rounded-b-[28px]`}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[28px]">🎨</span>
                  <div>
                    <div className="text-[17px] font-semibold tracking-[-0.02em]">Accent color</div>
                    <div className="mt-1 text-[14px] text-[#7c7c82]">Default</div>
                  </div>
                </div>
                <span className="text-[22px] text-[#111111]">⌄</span>
              </div>
            </button>
          </div>

          <div className="space-y-[2px]">
            {[
              ['⚙️', 'General'],
              ['🔔', 'Notifications'],
              ['🎙️', 'Voice'],
              ['🗄️', 'Data controls'],
              ['🛡️', 'Security'],
              ['🐞', 'Report bug'],
              ['ⓘ', 'About'],
            ].map(([icon, label], index, arr) => (
              <button
                key={label}
                type="button"
                className={`${itemBase} ${
                  index === 0 ? 'rounded-t-[28px] rounded-b-[8px]' : ''
                } ${
                  index > 0 && index < arr.length - 1 ? 'rounded-[8px]' : ''
                } ${
                  index === arr.length - 1 ? 'rounded-t-[8px] rounded-b-[28px]' : ''
                }`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[28px]">{icon}</span>
                  <div className="text-[17px] font-semibold tracking-[-0.02em]">{label}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="w-full rounded-[28px] bg-[#f7f7f8] px-5 py-5 text-left"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="flex items-center gap-4 text-[#ef4444]">
              <span className="text-[28px]">↪</span>
              <div className="text-[17px] font-semibold tracking-[-0.02em]">Log out</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
