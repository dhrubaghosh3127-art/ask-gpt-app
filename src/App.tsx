import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import PremiumPage from './pages/PremiumPage';
import KeySetup from './pages/KeySetup';
import HistoryPage from './pages/HistoryPage';
import ArchivedPage from './pages/ArchivedPage';
import Sidebar from './components/Sidebar';
import SettingsPage from './pages/SettingsPage';
import GeneralPage from './pages/GeneralPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AuthPage from './pages/AuthPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import MyProfilePage from './pages/MyProfilePage';
import { getAuthState } from './utils/storage';
const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
  const root = document.documentElement;

  if (isDarkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

  const savedAccent =
    (localStorage.getItem('accentColor') as
      | 'default'
      | 'blue'
      | 'green'
      | 'yellow'
      | 'pink'
      | 'orange'
      | 'purple') || 'default';

  const palette = {
    default: {
      bubble: '#bfdbfe',
      send: '#111111',
      caret: '#111111',
    },
    blue: {
      bubble: '#bfdbfe',
      send: '#2563eb',
      caret: '#2563eb',
    },
    green: {
      bubble: '#bbf7d0',
      send: '#16a34a',
      caret: '#16a34a',
    },
    yellow: {
      bubble: '#fef08a',
      send: '#eab308',
      caret: '#eab308',
    },
    pink: {
      bubble: '#fbcfe8',
      send: '#ec4899',
      caret: '#ec4899',
    },
    orange: {
      bubble: '#fed7aa',
      send: '#f97316',
      caret: '#f97316',
    },
    purple: {
      bubble: '#ddd6fe',
      send: '#8b5cf6',
      caret: '#8b5cf6',
    },
  } as const;

  const current = palette[savedAccent];

  root.style.setProperty('--accent-user-bubble', current.bubble);
  root.style.setProperty('--accent-send-button', current.send);
  root.style.setProperty('--accent-caret', current.caret);
}, [isDarkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
const startPath = useMemo(() => {
  const authState = getAuthState();

  if (authState.isLoggedIn && authState.user) {
    return '/chat';
  }

  return '/auth';
}, []);
  return (
    <Router>
  <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <Sidebar
      isOpen={isSidebarOpen}
      setIsOpen={setIsSidebarOpen}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />

    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden h-[100dvh] max-h-[100dvh]">
      <Routes>
        <Route path="/" element={<Navigate to={startPath} />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/chat" element={<ChatPage toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
        <Route path="/chat/:id" element={<ChatPage toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/archived" element={<ArchivedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/general" element={<GeneralPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/key" element={<KeySetup />} />
      </Routes>
    </main>
  </div>
</Router>
  );
};

export default App;
  
