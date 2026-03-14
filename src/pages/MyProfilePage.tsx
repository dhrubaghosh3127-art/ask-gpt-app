import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import { clearAuthState, clearGuestConversations, clearGuestMode, getAuthState } from '../utils/storage';

const RowCard = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="rounded-[20px] bg-[#f7f7f8] px-4 py-3.5">
    <div className="flex items-center gap-3">
      <div className="flex h-[24px] w-[24px] items-center justify-center text-[#111111]">
        {icon}
      </div>

      <div className="min-w-0">
        <div
          className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          {title}
        </div>

        {subtitle ? (
          <div
            className="mt-0.5 text-[12px] text-[#6b7280]"
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

  const displayAge =
    authState.user?.age
      ? `Age: ${authState.user.age}`
      : 'Not added yet';

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }, [displayName]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }

    clearAuthState();
    clearGuestMode();
    clearGuestConversations();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex h-screen w-full max-w-[430px] flex-col px-4 pt-4 pb-5 overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
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
        </button>

        <div className="mb-4 flex flex-col items-center">
          <div className="relative mb-2">
            <div
              className="flex h-[84px] w-[84px] items-center justify-center rounded-full text-[30px] font-medium text-white"
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
              className="absolute bottom-0 right-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#ececf2] bg-white text-[13px] shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
            >
              ✎
            </button>
          </div>

          <div
            className="text-center text-[16px] font-semibold tracking-[-0.03em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            {displayName}
          </div>
        </div>

        <div
          className="mb-2 text-[12px] text-[#9ca3af]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          My ASK-GPT
        </div>

        <div className="space-y-2">
          <RowCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 14c.8 1 2 1.5 3.5 1.5s2.7-.5 3.5-1.5" />
              </svg>
            }
            title="Personalization"
          />

          <RowCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="2.5" />
                <circle cx="17" cy="7" r="2.5" />
                <circle cx="7" cy="17" r="2.5" />
                <circle cx="17" cy="17" r="2.5" />
              </svg>
            }
            title="Apps"
          />
        </div>

        <div
          className="mt-4 mb-2 text-[12px] text-[#9ca3af]"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Account
        </div>

        <div className="space-y-2">
          <RowCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" />
              </svg>
            }
            title="Upgrade to ASK-GPT Plus"
          />

          <RowCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            }
            title="Email"
            subtitle={displayEmail}
          />

          <RowCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            }
            title="Age verification"
            subtitle={displayAge}
          />
        </div>

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-[20px] bg-[#f7f7f8] px-4 py-3.5 text-left"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-[24px] w-[24px] items-center justify-center text-[#ef4444]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </div>

              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#ef4444]">
                Log out
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
