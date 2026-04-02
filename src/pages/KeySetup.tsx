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

const BackIcon = () => (
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

const KeyIcon = () => (
  <svg
    className="h-5 w-5"
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
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 3h7v7" />
    <path d="M10 14L21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    className="h-5 w-5"
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
  } catch {
    // fallback below
  }

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
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-8 pt-4">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
            style={{ fontFamily: pageFont }}
          >
            <BackIcon />
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1
            className="text-[28px] font-bold tracking-[-0.04em] text-[#111111]"
            style={{ fontFamily: pageFont }}
          >
            Add your Groq API key
          </h1>

          <p
            className="mx-auto mt-3 max-w-[340px] text-[15px] leading-6 text-[#6b7280]"
            style={{ fontFamily: pageFont }}
          >
            Use your own Groq key to power ASK-GPT on this device with a clean,
            direct setup.
          </p>
        </div>

        <div
          className="mb-5 rounded-[24px] border border-[#ffd7d7] bg-[#fff5f5] px-4 py-4"
          style={{ fontFamily: pageFont }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-[2px] text-[#d92d20]">
              <ShieldIcon />
            </div>

            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#d92d20]">
                Private device-only storage
              </div>
              <div className="mt-1 text-[13px] leading-5 text-[#b42318]">
                Your API key is stored only in your browser local storage on
                this device. This page does not save, log, or send your key to
                our server for viewing.
              </div>
            </div>
          </div>
        </div>

        <div
          className="mb-5 rounded-[24px] border border-[#ececf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          style={{ fontFamily: pageFont }}
        >
          <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#111111]">
            How to get a Groq API key
          </div>

          <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#4b5563]">
            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">1.</span>
              <span>Open your Groq Console and sign in to your account.</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">2.</span>
              <span>Go to the API Keys page and create a new key.</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">3.</span>
              <span>Copy the key and paste it into the field below.</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">4.</span>
              <span>Tap Save to keep the key on this device only.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenGroqKeys}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-[15px] font-semibold text-white"
            style={{ fontFamily: pageFont }}
          >
            Open Groq API Keys
            <ExternalLinkIcon />
          </button>
        </div>

        <div
          className="mb-5 rounded-[24px] border border-[#ececf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          style={{ fontFamily: pageFont }}
        >
          <div className="flex items-center gap-2">
            <div className="text-[#111111]">
              <KeyIcon />
            </div>
            <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#111111]">
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
            className="mt-4 h-[112px] w-full resize-none rounded-[20px] border border-[#e5e7eb] bg-[#fafafa] px-4 py-4 text-[15px] text-[#111111] outline-none placeholder:text-[#9ca3af]"
            style={{ fontFamily: pageFont }}
          />

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-full bg-[#111111] px-5 py-3 text-[16px] font-semibold text-white"
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
              className="rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-[15px] font-semibold text-[#111111]"
              style={{ fontFamily: pageFont }}
            >
              Clear
            </button>
          </div>
        </div>

        <div
          className="mb-5 rounded-[24px] border border-[#ececf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          style={{ fontFamily: pageFont }}
        >
          <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#111111]">
            Saved key
          </div>

          <div className="mt-4 rounded-[20px] border border-[#e5e7eb] bg-[#fafafa] px-4 py-4">
            {savedKey ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">
                    Stored on this device
                  </div>
                  <div className="mt-1 truncate text-[16px] font-semibold tracking-[-0.01em] text-[#111111]">
                    {maskedSavedKey}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySavedKey}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-[14px] font-semibold text-[#111111]"
                  style={{ fontFamily: pageFont }}
                >
                  <CopyIcon />
                  {isCopying ? 'Copying...' : 'Copy'}
                </button>
              </div>
            ) : (
              <div className="text-[15px] text-[#9ca3af]">
                No key saved on this device yet.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearSavedKey}
            className="mt-4 w-full rounded-full border border-[#f0d5d5] bg-[#fff5f5] px-5 py-3 text-[15px] font-semibold text-[#d92d20]"
            style={{ fontFamily: pageFont }}
          >
            Clear saved key
          </button>
        </div>

        {statusText && (
          <div
            className={`rounded-[20px] px-4 py-3 text-[14px] leading-6 ${
              statusType === 'success'
                ? 'bg-[#f4fff6] text-[#067647] border border-[#c7f0d1]'
                : 'bg-[#fff5f5] text-[#d92d20] border border-[#ffd7d7]'
            }`}
            style={{ fontFamily: pageFont }}
          >
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeySetup;
