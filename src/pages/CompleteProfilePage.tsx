import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppUser } from '../types';
import {
  clearGuestConversations,
  clearGuestMode,
  getUserProfile,
  saveAuthState,
  saveUserProfile,
} from '../utils/storage';

type CompleteProfileState = {
  uid?: string;
  email?: string;
  provider?: 'google' | 'email';
};

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as CompleteProfileState;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    if (!state.uid || !state.email || !state.provider) {
      navigate('/auth');
      return;
    }

    const existingUser = getUserProfile(state.uid);
    if (existingUser) {
      saveAuthState({
        isGuest: false,
        isLoggedIn: true,
        hasSeenAuthScreen: true,
        user: existingUser,
      });
      navigate('/chat');
    }
  }, [navigate, state.email, state.provider, state.uid]);

  const handleContinue = () => {
    if (!state.uid || !state.email || !state.provider) return;
    if (!name.trim() || !age.trim()) return;

    const user: AppUser = {
      uid: state.uid,
      email: state.email,
      name: name.trim(),
      age: age.trim(),
      provider: state.provider,
      createdAt: Date.now(),
    };

    saveUserProfile(user);
    saveAuthState({
      isGuest: false,
      isLoggedIn: true,
      hasSeenAuthScreen: true,
      user,
    });
    clearGuestMode();
    clearGuestConversations();
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pt-5 pb-6">
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="mb-8 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
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
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h1
              className="text-[28px] font-bold tracking-[-0.04em] text-[#111111]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              Complete your profile
            </h1>

            <p
              className="mt-3 text-[15px] leading-6 text-[#6b7280]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              Add your name and age to finish creating your ASK-GPT account.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[#6b7280]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-[20px] border border-[#e5e7eb] bg-white px-4 py-4 text-[16px] font-medium tracking-[-0.02em] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[#6b7280]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              >
                Age
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full rounded-[20px] border border-[#e5e7eb] bg-white px-4 py-4 text-[16px] font-medium tracking-[-0.02em] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!name.trim() || !age.trim()}
              className="mt-2 w-full rounded-full px-5 py-4 text-[16px] font-semibold tracking-[-0.02em] text-white disabled:opacity-50"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
                backgroundColor: '#111111',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
