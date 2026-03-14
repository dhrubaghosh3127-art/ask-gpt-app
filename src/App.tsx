import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import PremiumPage from './pages/PremiumPage';
import KeySetup from './pages/KeySetup';
import HistoryPage from './pages/HistoryPage';
import ArchivedPage from './pages/ArchivedPage';
import Sidebar from './components/Sidebar';
import SettingsPage from './pages/SettingsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AuthPage from './pages/AuthPage';
import { getAuthState } from './utils/storage';
const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
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
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
        />
        
        <main className="flex-1 flex flex-col min-w-0 relative">
          <Routes>
            <Route path="/" element={<Navigate to={startPath} />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/chat" element={<ChatPage toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
            <Route path="/chat/:id" element={<ChatPage toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
            <Route path="/history" element={<HistoryPage />} />
<Route path="/history/archived" element={<ArchivedPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
<Route path="/key" element={<KeySetup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
  
