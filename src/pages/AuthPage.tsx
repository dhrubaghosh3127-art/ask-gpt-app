import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  clearGuestConversations,
  clearGuestMode,
  getAuthState,
  getDefaultAuthState,
  getUserProfile,
  saveAuthState,
  setSeenGuestMode,
} from '../utils/storage';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5A9.5 9.5 0 1 0 21.5 12c0-.6-.1-1.2-.2-1.8H12Z"
    />
    <path
      fill="#34A853"
      d="M4.9 14.3l-.6 2.3-2.2.1A9.4 9.4 0 0 1 2.5 7.8l2 .4.9 2.1A5.7 5.7 0 0 0 4.9 14.3Z"
    />
    <path
      fill="#4A90E2"
      d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.7-5.5-4.1l-2.8 2.2A9.5 9.5 0 0 0 12 21.5Z"
    />
    <path
      fill="#FBBC05"
      d="M6.5 13.5A5.7 5.7 0 0 1 6.2 12c0-.5.1-1 .2-1.5L3.5 8.2A9.5 9.5 0 0 0 2.5 12c0 1.5.3 3 .9 4.3l3.1-2.8Z"
    />
  </svg>
);

const EmailIcon = () => (
  <svg
    className="h-5 w-5 text-[#111111]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    const savedAuth = getAuthState();

    if (savedAuth.isLoggedIn && savedAuth.user) {
      navigate('/chat', { replace: true });
      return;
    }
getRedirectResult(auth).then((result) => {
  const redirectUser = result?.user;

  if (!redirectUser || !redirectUser.email) return;
  if (handledRef.current) return;

  handledRef.current = true;

  const existingUser = getUserProfile(redirectUser.uid);

  if (existingUser) {
    saveAuthState({
      isGuest: false,
      isLoggedIn: true,
      hasSeenAuthScreen: true,
      user: existingUser,
    });

    clearGuestMode();
    clearGuestConversations();
    navigate('/chat', { replace: true });
    return;
  }

  navigate('/complete-profile', {
    replace: true,
    state: {
      uid: redirectUser.uid,
      email: redirectUser.email,
      provider: 'google',
    },
  });
});

    }, [navigate]);

  const handleSkip = () => {
    clearGuestConversations();
    saveAuthState({
      ...getDefaultAuthState(),
      isGuest: true,
      hasSeenAuthScreen: true,
    });
    setSeenGuestMode();
    navigate('/chat');
  };

  const handleGoogleSignIn = async () => {
  try {
    setLoading(true);
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    setLoading(false);
    console.error('Google sign-in failed:', error);

    const err = error as { code?: string; message?: string };

    alert(
      `Google sign-in failed\n\nCode: ${err.code || 'unknown'}\nMessage: ${err.message || 'no message'}`
    );
  }
};

  const handleEmailClick = () => {
    alert('Continue with Email will be activated next.');
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pt-5 pb-6">
        <div className="mb-8 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[15px] font-semibold tracking-[-0.02em] text-[#6b7280]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <h1
              className="text-[28px] font-bold tracking-[-0.04em] text-[#111111]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              Sign in to ASK-GPT
            </h1>

            <p
              className="mt-3 text-[15px] leading-6 text-[#6b7280]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              Continue with Google or email to save your chats, keep your history,
              and access your ASK-GPT account anytime.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-[#e5e7eb] bg-white px-5 py-4 text-[16px] font-semibold tracking-[-0.02em] text-[#111111] shadow-[0_2px_10px_rgba(15,23,42,0.03)] disabled:opacity-60"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              <GoogleIcon />
              <span>{loading ? 'Please wait...' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              onClick={handleEmailClick}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-[#e5e7eb] bg-white px-5 py-4 text-[16px] font-semibold tracking-[-0.02em] text-[#111111] shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              <EmailIcon />
              <span>Continue with Email</span>
            </button>
          </div>

          <div
            className="mt-8 text-center text-[13px] leading-5 text-[#9ca3af]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            You can skip for now and use ASK-GPT as a guest, but guest chat history
            will not be saved after you leave the app.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
