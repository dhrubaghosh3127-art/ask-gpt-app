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
    <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" />
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
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
  </svg>
);

const maskKey = (key: string): string => {
  const clean = key.trim();

  if (!clean) return '';
  if (clean.length <= 10) return `${clean.slice(0, 3)}***${clean.slice(-2)}`;

  return `${clean.slice(0, 7)}******${clean.slice(-2)}`;
};

const KeySetup: React.FC = () => {
  const navigate = useNavigate();

  const [inputKey, setInputKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [showingMasked, setShowingMasked] = useState(false);

  useEffect(() => {
    const existing = getUserApiKey();

    if (existing) {
      setSavedKey(existing);
      setInputKey(maskKey(existing));
      setShowingMasked(true);
    }
  }, []);

  const maskedSavedKey = useMemo(() => maskKey(savedKey), [savedKey]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusType(type);
    setStatusText(message);
  };

  const handleOpenGroqKeys = () => {
    window.open(GROQ_KEYS_URL, '_blank', 'noopener,noreferrer');
  };

  const handleTextareaFocus = () => {
    if (showingMasked) {
      setInputKey('');
      setShowingMasked(false);
      setStatusText('');
      setStatusType('');
    }
  };

  const handleSave = () => {
    const clean = inputKey.trim();

    if (!clean) {
      showStatus('error', 'Please paste your Groq API key first.');
      return;
    }

    if (showingMasked && savedKey) {
      showStatus('success', 'Your Groq API key is already saved on this device.');
      return;
    }

    setUserApiKey(clean);
    setSavedKey(clean);
    setInputKey(maskKey(clean));
    setShowingMasked(true);
    showStatus('success', 'Your Groq API key was saved on this device.');
  };

  const handleClear = () => {
    clearUserApiKey();
    setSavedKey('');
    setInputKey('');
    setShowingMasked(false);
    showStatus('success', 'The saved Groq API key was removed from this device.');
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
          <div
            className="text-[13px] font-semibold tracking-[0.06em] text-[#9ca3af]"
            style={{ fontFamily: pageFont }}
          >
            Device-only setup
          </div>

          <h1
            className="mt-3 text-[28px] font-bold tracking-[-0.04em] text-[#111111]"
            style={{ fontFamily: pageFont }}
          >
            Add your Groq API key
          </h1>

          <p
            className="mx-auto mt-3 max-w-[340px] text-[15px] leading-6 text-[#6b7280]"
            style={{ fontFamily: pageFont }}
          >
            Use your own Groq key to power ASK-GPT on this device with a clean
            direct setup.
          </p>
        </div>

        <div
          className="rounded-[24px] border border-[#ffd7d7] bg-[#fff5f5] px-4 py-4"
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
                Your API key stays only in this browser on this device. This
                page does not save, log, or send your key to our server for
                viewing.
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-5 rounded-[24px] border border-[#ececf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          style={{ fontFamily: pageFont }}
        >
          <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#111111]">
            Quick setup
          </div>

          <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#4b5563]">
            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">1.</span>
              <span>Open your Groq Console</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">2.</span>
              <span>Create a new API key</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">3.</span>
              <span>Paste the key in the field below</span>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#111111]">4.</span>
              <span>Tap Save to keep it on this device</span>
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
          className="mt-5 rounded-[24px] border border-[#ececf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
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
            onFocus={handleTextareaFocus}
            onChange={(e) => {
              setInputKey(e.target.value);

              if (statusText) {
                setStatusText('');
                setStatusType('');
              }

              if (showingMasked) {
                setShowingMasked(false);
              }
            }}
            placeholder="Paste your Groq API key here"
            className="mt-4 h-[132px] w-full resize-none rounded-[20px] border border-[#e5e7eb] bg-[#fafafa] px-4 py-4 text-[16px] font-medium tracking-[-0.01em] text-[#111111] outline-none placeholder:text-[#9ca3af]"
            style={{ fontFamily: pageFont }}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />

          {maskedSavedKey && showingMasked && (
            <div
              className="mt-3 text-[13px] font-medium text-[#6b7280]"
              style={{ fontFamily: pageFont }}
            >
              Saved on this device: <span className="text-[#111111]">{maskedSavedKey}</span>
            </div>
          )}

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
              onClick={handleClear}
              className="rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-[16px] font-semibold text-[#111111]"
              style={{ fontFamily: pageFont }}
            >
              Clear
            </button>
          </div>
        </div>

        {statusText && (
          <div
            className={`mt-5 rounded-[20px] border px-4 py-3 text-[14px] leading-6 ${
              statusType === 'success'
                ? 'border-[#c7f0d1] bg-[#f4fff6] text-[#067647]'
                : 'border-[#ffd7d7] bg-[#fff5f5] text-[#d92d20]'
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
