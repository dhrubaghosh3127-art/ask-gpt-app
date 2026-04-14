import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearUserApiKey,
  getUserApiKey,
  setUserApiKey,
} from '../utils/storage';

const pageFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif';

const GROQ_KEYS_URL = 'https://console.groq.com/keys';
const GROQ_MODELS_URL = 'https://console.groq.com/settings/limits';

const BackIcon = () => (
  <svg
    className="h-5 w-5"
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

const KeyIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="15" r="4" />
    <path d="M12 15h8" />
    <path d="M17 12v6" />
    <path d="M20 13v4" />
  </svg>
);

const CopyIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V4a2 2 0 0 1 2-2h9" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 3h7v7" />
    <path d="M10 14L21 3" />
    <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
  </svg>
);

const maskKey = (key: string): string => {
  const clean = key.trim();
  if (!clean) return '';
  if (clean.length <= 10) return `${clean.slice(0, 3)}***${clean.slice(-2)}`;
  return `${clean.slice(0, 7)}********${clean.slice(-4)}`;
};

const copyText = async (value: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}

  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
};

const KeySetup: React.FC = () => {
  const navigate = useNavigate();

  const [inputKey, setInputKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const existing = getUserApiKey();
    setSavedKey(existing);
  }, []);

  const maskedSavedKey = useMemo(() => maskKey(savedKey), [savedKey]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusType(type);
    setStatusText(message);
  };

  const handleOpenGroqKeys = () => {
    window.open(GROQ_KEYS_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGroqModels = () => {
    window.open(GROQ_MODELS_URL, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    const clean = inputKey.trim();

    if (!clean) {
      showStatus('error', 'Please paste your Groq API key first.');
      return;
    }

    setUserApiKey(clean);
    setSavedKey(clean);
    setInputKey('');
    showStatus('success', 'Your Groq API key was saved on this device.');
  };

  const handleClearSavedKey = () => {
    clearUserApiKey();
    setSavedKey('');
    setInputKey('');
    showStatus('success', 'The saved Groq API key was removed from this device.');
  };

  const handleCopySavedKey = async () => {
    if (!savedKey || isCopying) return;

    setIsCopying(true);
    const ok = await copyText(savedKey);
    setIsCopying(false);

    if (ok) {
      showStatus('success', 'Saved key copied.');
    } else {
      showStatus('error', 'Copy failed on this device. Please copy it manually.');
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-white text-[#111111]">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col px-3 pb-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
            style={{ fontFamily: pageFont }}
          >
            <BackIcon />
          </button>

          <div
            className="text-center text-[11px] font-medium tracking-[0.04em] text-[#8a8a8f]"
            style={{ fontFamily: pageFont }}
          >
            Device-only setup
          </div>

          <div className="w-[42px]" />
        </div>

        <div className="mb-3 text-center">
          <h1
            className="text-[24px] font-bold tracking-[-0.03em] text-[#111111]"
            style={{ fontFamily: pageFont }}
          >
            Add your Groq API key
          </h1>

          <p
            className="mx-auto mt-1 max-w-[330px] text-[12px] leading-5 text-[#6b7280]"
            style={{ fontFamily: pageFont }}
          >
            Use your own Groq API key to power ASK-GPT on this device with a clean,
            direct setup.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-[#ececf2] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
          <div className="h-full overflow-y-auto px-3 py-3">
            <div
              className="rounded-[20px] border border-[#ffd7d7] bg-[#fff5f5] px-3 py-3"
              style={{ fontFamily: pageFont }}
            >
              <div className="flex items-start gap-2">
                <div className="mt-[1px] text-[#d92d20]">
                  <ShieldIcon />
                </div>

                <div className="min-w-0">
                  <div className="text-[14px] font-semibold tracking-[-0.02em] text-[#d92d20]">
                    Private device-only storage
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-[#b42318]">
                    Your API key stays only in this browser on this device. It is not
                    sent to our server for storage.
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-3 rounded-[20px] border border-[#ececf2] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              style={{ fontFamily: pageFont }}
            >
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                Quick setup
              </div>

              <div className="mt-2 space-y-1.5 text-[11px] leading-4 text-[#4b5563]">
                <div>
                  <span className="font-semibold text-[#111111]">1.</span> Open your Groq
                  Console
                </div>
                <div>
                  <span className="font-semibold text-[#111111]">2.</span> Create a new API
                  key
                </div>
                <div>
                  <span className="font-semibold text-[#111111]">3.</span> Paste it below
                </div>
                <div>
                  <span className="font-semibold text-[#111111]">4.</span> Tap Save key to
                  keep it on this device
                </div>
                <div>
                  <span className="font-semibold text-[#111111]">5.</span> In Groq, review
                  your enabled models if replies do not appear
                </div>
                <div>
                  <span className="font-semibold text-[#111111]">6.</span> If the app stops
                  replying after model changes, first check whether the required models are
                  still enabled in your Groq account
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenGroqKeys}
                  className="inline-flex h-[40px] items-center gap-2 rounded-full bg-[#111111] px-4 text-[12px] font-semibold text-white"
                  style={{ fontFamily: pageFont }}
                >
                  <span>Open Groq API Keys</span>
                  <ExternalLinkIcon />
                </button>

                <button
                  type="button"
                  onClick={handleOpenGroqModels}
                  className="inline-flex h-[40px] items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-[12px] font-semibold text-[#111111]"
                  style={{ fontFamily: pageFont }}
                >
                  <span>Check enabled models</span>
                  <ExternalLinkIcon />
                </button>
              </div>
            </div>

            <div
              className="mt-3 rounded-[20px] border border-[#ececf2] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              style={{ fontFamily: pageFont }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[#111111]">
                  <KeyIcon />
                </div>
                <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                  Paste API key
                </div>
              </div>

              <textarea
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (statusText) {
                    setStatusText('');
                    setStatusType('');
                  }
                }}
                placeholder="Paste your Groq API key here"
                className="h-[118px] w-full resize-none rounded-[18px] border border-[#e5e7eb] bg-[#fafafa] px-3 py-3 text-[13px] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                style={{ fontFamily: pageFont }}
              />

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex h-[42px] flex-1 items-center justify-center rounded-full bg-[#111111] px-4 text-[14px] font-semibold text-white"
                  style={{ fontFamily: pageFont }}
                >
                  Save key
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputKey('');
                    setStatusText('');
                    setStatusType('');
                  }}
                  className="flex h-[42px] items-center justify-center rounded-full border border-[#e5e7eb] bg-white px-5 text-[14px] font-semibold text-[#111111]"
                  style={{ fontFamily: pageFont }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              className="mt-3 rounded-[20px] border border-[#ececf2] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              style={{ fontFamily: pageFont }}
            >
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                Saved key
              </div>

              <div className="mt-2 rounded-[16px] border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5">
                {savedKey ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">
                        Stored on this device
                      </div>
                      <div className="mt-1 truncate text-[13px] font-semibold tracking-[-0.01em] text-[#111111]">
                        {maskedSavedKey}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySavedKey}
                      className="inline-flex h-[36px] items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 text-[13px] font-semibold text-[#111111]"
                      style={{ fontFamily: pageFont }}
                    >
                      <CopyIcon />
                      <span>{isCopying ? 'Copying...' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[12px] text-[#9ca3af]">No key saved on this device yet.</div>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearSavedKey}
                className="mt-2 flex h-[42px] w-full items-center justify-center rounded-full border border-[#ffd5d5] bg-[#fff5f5] px-4 text-[14px] font-semibold text-[#d92d20]"
                style={{ fontFamily: pageFont }}
              >
                Clear saved key
              </button>
            </div>

            <div
              className="mt-3 rounded-[20px] border border-[#ececf2] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              style={{ fontFamily: pageFont }}
            >
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                Privacy
              </div>

              <div className="mt-1 text-[11px] leading-4 text-[#6b7280]">
                Review how ASK-GPT handles local device data before saving your key.
              </div>

              <button
                type="button"
                onClick={() => window.open('/legal/privacy-policy.html', '_blank', 'noopener,noreferrer')}
                className="mt-2 inline-flex h-[40px] items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-[12px] font-semibold text-[#111111]"
                style={{ fontFamily: pageFont }}
              >
                <span>Open Privacy Policy</span>
                <ExternalLinkIcon />
              </button>
            </div>

            {statusText ? (
              <div
                className={`mt-3 rounded-[18px] px-3 py-2 text-[11px] leading-4 ${
                  statusType === 'success'
                    ? 'border border-[#c7f0d1] bg-[#f4fff6] text-[#067647]'
                    : 'border border-[#ffd7d7] bg-[#fff5f5] text-[#d92d20]'
                }`}
                style={{ fontFamily: pageFont }}
              >
                {statusText}
              </div>
            ) : (
              <div className="h-[2px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeySetup;
