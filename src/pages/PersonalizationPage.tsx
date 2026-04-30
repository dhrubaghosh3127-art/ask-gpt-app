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
  const [toneOpen, setToneOpen] = useState(false);
  const [tone, setTone] = useState<'Default' | 'Professional' | 'Friendly' | 'Simple' | 'Funny' | 'Direct'>(() => {
    const saved = localStorage.getItem('askgpt_tone');
    return saved === 'Default' ||
      saved === 'Professional' ||
      saved === 'Friendly' ||
      saved === 'Simple' ||
      saved === 'Funny' ||
      saved === 'Direct'
      ? saved
      : 'Friendly';
  });

  const selectTone = (value: 'Default' | 'Professional' | 'Friendly' | 'Simple' | 'Funny' | 'Direct') => {
    setTone(value);
    localStorage.setItem('askgpt_tone', value);
    setToneOpen(false);
  };
  const [responseStyleOpen, setResponseStyleOpen] = useState(false);
  const [responseStyle, setResponseStyle] = useState<
    'Balanced' | 'Detailed' | 'Short' | 'Creative'
  >(() => {
    const saved = localStorage.getItem('askgpt_response_style');
    return saved === 'Balanced' ||
      saved === 'Detailed' ||
      saved === 'Short' ||
      saved === 'Creative'
      ? saved
      : 'Balanced';
  });

  const selectResponseStyle = (
    value: 'Balanced' | 'Detailed' | 'Short' | 'Creative'
  ) => {
    setResponseStyle(value);
    localStorage.setItem('askgpt_response_style', value);
    setResponseStyleOpen(false);
  };
  const hasCustomInstructions =
    Boolean(localStorage.getItem('askgpt_custom_name')?.trim()) ||
    Boolean(localStorage.getItem('askgpt_custom_about')?.trim()) ||
    Boolean(localStorage.getItem('askgpt_custom_response')?.trim());
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(() => {
    const saved = localStorage.getItem('askgpt_memory_enabled');
    return saved === null ? true : saved === 'true';
  });

  const toggleMemory = () => {
    setMemoryEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('askgpt_memory_enabled', String(next));
      return next;
    });
  };
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
const [fontSize, setFontSize] = useState(() => {
  const saved = localStorage.getItem('askgpt_font_size');
  return saved === 'Small' || saved === 'Medium' || saved === 'Large'
    ? saved
    : 'Medium';
});

const selectFontSize = (value: string) => {
  setFontSize(value);
  localStorage.setItem('askgpt_font_size', value);
  setFontSizeOpen(false);
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
  value={responseStyle}
  onClick={() => setResponseStyleOpen(true)}
/>
          <PersonalizationRow
  icon={<ToneIcon />}
  title="Tone"
  value={tone}
  onClick={() => setToneOpen(true)}
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
  value={hasCustomInstructions ? 'Added' : 'Set'}
  onClick={() => navigate('/custom-instructions')}
/>
          <PersonalizationRow
  icon={<MemoryIcon />}
  title="Memory"
  value={memoryEnabled ? 'On' : 'Off'}
  onClick={() => setMemoryOpen(true)}
/>
        </div>

        <PersonalizationRow
  icon={<FontSizeIcon />}
  title="Font Size"
  value={fontSize}
  onClick={() => setFontSizeOpen(true)}
/>
        </div>
      </div>
    {fontSizeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25"
          onClick={() => setFontSizeOpen(false)}
        >
          <div className="flex h-full items-center justify-end px-6">
            <div
              className="w-[190px] overflow-hidden rounded-[24px] bg-white shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              {['Small', 'Medium', 'Large'].map((size, index) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => selectFontSize(size)}
                  className={`flex h-[52px] w-full items-center justify-between px-4 text-left ${
                    index !== 0 ? 'border-t border-[#efefef]' : ''
                  }`}
                >
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                    {size}
                  </span>

                  {fontSize === size && (
                    <span className="shrink-0 text-[22px] font-semibold leading-none text-[#111111]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {memoryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/35"
          onClick={() => setMemoryOpen(false)}
        >
          <div
            className="w-full rounded-t-[32px] bg-[#fbfcf8] px-5 pt-3 pb-5 shadow-[0_-18px_50px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <div className="mb-4 flex justify-center">
              <div className="h-[6px] w-[58px] rounded-full bg-[#d5d7dc]" />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
                Memory
              </div>

              <button
                type="button"
                onClick={() => setMemoryOpen(false)}
                className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#f1f3f0] text-[26px] leading-none text-[#111111]"
                aria-label="Close memory"
              >
                ×
              </button>
            </div>

            <p className="mb-5 text-[14px] font-medium leading-[1.45] text-[#7c7c82]">
              Allow ASK-GPT to remember your preferences on this device.
            </p>

            <div className="overflow-hidden rounded-[24px] bg-white">
              <div className="flex h-[64px] items-center justify-between px-4">
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                    Memory
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium text-[#8b8e98]">
                    {memoryEnabled ? 'On' : 'Off'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleMemory}
                  className={`relative h-[32px] w-[56px] rounded-full transition-all ${
                    memoryEnabled ? 'bg-[#111111]' : 'bg-[#d7d8dc]'
                  }`}
                  aria-label="Toggle memory"
                >
                  <span
                    className={`absolute top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-sm transition-all ${
                      memoryEnabled ? 'left-[27px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMemoryOpen(false)}
              className="mt-4 h-[52px] w-full rounded-[22px] bg-[#111111] text-[16px] font-semibold tracking-[-0.02em] text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
      {responseStyleOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25"
          onClick={() => setResponseStyleOpen(false)}
        >
          <div className="flex h-full items-center justify-end px-6">
            <div
              className="w-[232px] overflow-hidden rounded-[24px] bg-white shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              {[
                { name: 'Balanced', desc: 'Normal and clear' },
                { name: 'Detailed', desc: 'More explanation' },
                { name: 'Short', desc: 'Quick and concise' },
                { name: 'Creative', desc: 'Ideas and writing' },
              ].map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    selectResponseStyle(
                      item.name as 'Balanced' | 'Detailed' | 'Short' | 'Creative'
                    )
                  }
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left ${
                    index !== 0 ? 'border-t border-[#efefef]' : ''
                  }`}
                >
                  <div className="pr-3">
                    <div className="text-[14px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111111]">
                      {item.name}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium leading-[1.2] text-[#9a9a9a]">
                      {item.desc}
                    </div>
                  </div>

                  {responseStyle === item.name && (
                    <span className="shrink-0 text-[22px] font-semibold leading-none text-[#111111]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
{toneOpen && (
  <div
    className="fixed inset-0 z-50 bg-black/25"
    onClick={() => setToneOpen(false)}
  >
    <div className="flex h-full items-center justify-end px-5">
      <div
        className="w-[252px] overflow-hidden rounded-[26px] bg-white shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        {[
          { name: 'Default', desc: 'Preset style and tone' },
          { name: 'Professional', desc: 'Polished and precise' },
          { name: 'Friendly', desc: 'Warm and helpful' },
          { name: 'Simple', desc: 'Clear and easy' },
          { name: 'Funny', desc: 'Playful and light' },
          { name: 'Direct', desc: 'Concise and straight' },
        ].map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() =>
              selectTone(
                item.name as
                  | 'Default'
                  | 'Professional'
                  | 'Friendly'
                  | 'Simple'
                  | 'Funny'
                  | 'Direct'
              )
            }
            className={`flex w-full items-center justify-between px-4 py-2.5 text-left ${
              index !== 0 ? 'border-t border-[#efefef]' : ''
            }`}
          >
            <div className="pr-3">
              <div className="text-[14px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111111]">
                {item.name}
              </div>
              <div className="mt-0.5 text-[11.5px] font-medium leading-[1.25] text-[#9a9a9a]">
                {item.desc}
              </div>
            </div>

            {tone === item.name && (
              <span className="shrink-0 text-[22px] font-semibold leading-none text-[#111111]">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
)}
      {defaultModeOpen && (
  <div
    className="fixed inset-0 z-50 flex items-end bg-black/35"
    onClick={() => setDefaultModeOpen(false)}
  >
    <div
      className="w-full rounded-t-[32px] bg-[#fbfcf8] px-5 pt-3 pb-5 shadow-[0_-18px_50px_rgba(0,0,0,0.18)]"
      onClick={(e) => e.stopPropagation()}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <div className="mb-4 flex justify-center">
        <div className="h-[6px] w-[58px] rounded-full bg-[#d5d7dc]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
          Default Mode
        </div>

        <button
          type="button"
          onClick={() => setDefaultModeOpen(false)}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#f1f3f0] text-[26px] leading-none text-[#111111]"
          aria-label="Close default mode"
        >
          ×
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white">
        {(['Auto', 'Thinking', 'Fast'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectDefaultMode(mode)}
            className="flex h-[58px] w-full items-center justify-between border-b border-[#e7e7e2] px-4 text-left last:border-b-0"
          >
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
              {mode}
            </span>

            {defaultMode === mode && (
              <span className="text-[18px] font-semibold text-[#111111]">
                ✓
              </span>
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

export default PersonalizationPage;
