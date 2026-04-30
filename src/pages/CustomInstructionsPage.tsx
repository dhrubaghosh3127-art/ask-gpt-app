import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <path d="M12 19 5 12l7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CustomInstructionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState(() => {
    return localStorage.getItem('askgpt_custom_name') || '';
  });

  const [about, setAbout] = useState(() => {
    return localStorage.getItem('askgpt_custom_about') || '';
  });

  const [response, setResponse] = useState(() => {
    return localStorage.getItem('askgpt_custom_response') || '';
  });

  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const handleSave = () => {
    localStorage.setItem('askgpt_custom_name', name.trim());
    localStorage.setItem('askgpt_custom_about', about.trim());
    localStorage.setItem('askgpt_custom_response', response.trim());

    showToast('Custom instructions saved.');
  };

  const handleReset = () => {
    setName('');
    setAbout('');
    setResponse('');

    localStorage.removeItem('askgpt_custom_name');
    localStorage.removeItem('askgpt_custom_about');
    localStorage.removeItem('askgpt_custom_response');

    showToast('Custom instructions reset.');
  };

  return (
    <div className="min-h-[100dvh] bg-white text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-4 pb-6 pt-4">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <ArrowLeftIcon />
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
            aria-label="Save custom instructions"
          >
            <CheckIcon />
          </button>
        </div>

        <div
          className="mb-8 text-center text-[30px] font-bold tracking-[-0.04em] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Custom Instructions
        </div>

        <div className="space-y-5">
          <div>
            <div
              className="mb-2 px-1 text-[15px] font-semibold tracking-[-0.02em] text-[#111111]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              What should ASK-GPT call you?
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name or nickname"
              className="w-full rounded-[24px] bg-[#f7f7f8] px-5 py-4 text-[16px] font-medium tracking-[-0.02em] text-[#111111] outline-none placeholder:text-[#9b9ca3]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            />
          </div>

          <div>
            <div
              className="mb-2 px-1 text-[15px] font-semibold tracking-[-0.02em] text-[#111111]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              What should ASK-GPT know about you?
            </div>

            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Share anything that may help ASK-GPT give better responses."
              rows={5}
              className="w-full resize-none rounded-[24px] bg-[#f7f7f8] px-5 py-4 text-[16px] font-medium leading-[1.45] tracking-[-0.02em] text-[#111111] outline-none placeholder:text-[#9b9ca3]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            />
          </div>

          <div>
            <div
              className="mb-2 px-1 text-[15px] font-semibold tracking-[-0.02em] text-[#111111]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              How should ASK-GPT respond?
            </div>

            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Tell ASK-GPT your preferred language, tone, detail level, or format."
              rows={5}
              className="w-full resize-none rounded-[24px] bg-[#f7f7f8] px-5 py-4 text-[16px] font-medium leading-[1.45] tracking-[-0.02em] text-[#111111] outline-none placeholder:text-[#9b9ca3]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            />
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleSave}
            className="h-[56px] w-full rounded-[24px] bg-[#111111] text-[16px] font-semibold tracking-[-0.02em] text-white"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="h-[56px] w-full rounded-[24px] bg-[#f7f7f8] text-[16px] font-semibold tracking-[-0.02em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            Reset
          </button>
        </div>

        <p
          className="mt-5 px-2 text-center text-[12px] font-medium leading-[1.45] text-[#8b8e98]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          These instructions will be used later to personalize ASK-GPT responses.
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
          <div
            className="rounded-[18px] bg-[#111111] px-5 py-3 text-[14px] font-medium text-white shadow-[0_14px_34px_rgba(0,0,0,0.25)]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomInstructionsPage;
