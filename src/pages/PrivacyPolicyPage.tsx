import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="rounded-[24px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] overflow-hidden">
          <div className="h-[78vh] overflow-y-auto px-5 py-5">
            <div
              className="mb-4 text-[20px] font-bold tracking-[-0.03em] text-[#111111]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              Privacy Policy
            </div>

            <div
              className="space-y-4 text-[15px] leading-7 text-[#3a3a3c]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <p>
                <strong className="text-[#111111]">ASK-GPT</strong> is designed with privacy and simplicity in mind.
                We aim to provide a safe experience while minimizing unnecessary access to user information.
              </p>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">1. No Dedicated ASK-GPT Server</div>
                <p>
                  ASK-GPT does not operate its own dedicated server for storing users&apos; private chats,
                  personal content, or self-added API keys during normal app use.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">2. Use of Multiple APIs</div>
                <p>
                  ASK-GPT may work with multiple AI APIs or service connections depending on the app configuration
                  and the features being used. The app is designed to function as an interface for those services
                  rather than as a separate data-monitoring platform.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">3. User&apos;s Own API Key</div>
                <p>
                  If a user enters their own API key, ASK-GPT is designed so that the developer does not have a
                  built-in option to directly view, read, or manually inspect that key during normal use of the app.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">4. User Privacy</div>
                <p>
                  ASK-GPT is intended to respect user privacy. The app is not built as a system for manually
                  reviewing users&apos; private conversations or personal content.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">5. Reports and Improvements</div>
                <p>
                  If a user reports a bug, technical issue, or app-related problem, that feedback may be used only
                  to improve app performance, stability, and user experience.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">6. Updates to This Policy</div>
                <p>
                  This Privacy Policy may be updated in the future if the app changes or improves. Any updated
                  version may be shown inside the app.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[15px] font-semibold text-[#111111]">7. Contact</div>
                <p>
                  If you have questions about this Privacy Policy, you may contact:
                </p>
                <p>
                  <strong className="text-[#111111]">App Name:</strong> ASK-GPT
                </p>
                <p>
                  <strong className="text-[#111111]">Contact:</strong> [Add contact method]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
