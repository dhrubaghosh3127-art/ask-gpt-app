import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { getAuthState } from '../utils/storage';

const ProfileCard = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="rounded-[24px] bg-[#f7f7f8] px-5 py-5">
    <div className="flex items-center gap-4">
      <div className="text-[28px] leading-none">{icon}</div>
      <div className="min-w-0">
        <div
          className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            className="mt-1 text-[14px] text-[#6b7280]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, []);

  const authState = getAuthState();

  const displayName =
    authState.user?.name ||
    firebaseUser?.displayName ||
    'ASK-GPT User';

  const displayEmail =
    authState.user?.email ||
    firebaseUser?.email ||
    'Not signed in';

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }, [displayName]);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-5 pt-5 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
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

        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div
              className="flex h-[110px] w-[110px] items-center justify-center rounded-full text-[42px] font-medium text-white"
              style={{
                backgroundColor: '#314a67',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
              }}
            >
              {initials}
            </div>

            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#ececf2] bg-white text-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
            >
              ✎
            </button>
          </div>

          <div
            className="text-center text-[18px] font-semibold tracking-[-0.03em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            {displayName}
          </div>
        </div>

        <div
          className="mb-4 text-[14px] text-[#9ca3af]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          My ASK-GPT
        </div>

        <div className="space-y-[2px]">
          <ProfileCard icon="🙂" title="Personalization" />
          <ProfileCard icon="◌◌" title="Apps" />
        </div>

        <div
          className="mt-8 mb-4 text-[14px] text-[#9ca3af]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Account
        </div>

        <div className="space-y-[2px]">
          <ProfileCard icon="⬡" title="Upgrade to ASK-GPT Plus" />
          <ProfileCard icon="✉" title="Email" subtitle={displayEmail} />
          <ProfileCard
            icon="◎"
            title="Age verification"
            subtitle={authState.user?.age ? `Age: ${authState.user.age}` : 'Not added yet'}
          />
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
