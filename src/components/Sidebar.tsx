import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Conversation, Role } from '../types';
import { getConversations, saveConversations } from '../utils/storage';
import { TOOL_CATEGORIES } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isDarkMode, setIsDarkMode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    setConversations(getConversations());
  }, [id, isOpen]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now()
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setConversations(updated);
    navigate(`/chat/${newId}`);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <div className={`
      ${isOpen ? 'w-72' : 'w-0'} 
      transition-all duration-300 ease-in-out bg-gray-900 text-white h-full flex flex-col overflow-hidden relative z-50
      md:relative absolute
    `}>
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 min-w-[250px]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ASK-GPT (v1)
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 hover:bg-gray-800 rounded">
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 border border-gray-700 hover:bg-gray-800 py-3 rounded-lg mb-6 transition-colors"
        >
          <span>+</span> New Chat
        </button>

        {/* Tools Section */}
        <div className="mb-6 min-w-[250px]">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Categories</h2>
          <div className="grid grid-cols-1 gap-1">
            {TOOL_CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => {
                  const newId = Date.now().toString();
                  const newConv: Conversation = {
                    id: newId,
                    title: cat.name,
                    messages: [{
                      id: 'welcome',
                      role: Role.MODEL,
                      content: `Hello! I am ready to help you with **${cat.name}**. How can I assist you today?`,
                      timestamp: Date.now()
                    }],
                    lastUpdated: Date.now(),
                    category: cat.id
                  };
                  const updated = [newConv, ...conversations];
                  saveConversations(updated);
                  setConversations(updated);
                  navigate(`/chat/${newId}`);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 rounded-md transition-colors"
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto min-w-[250px]">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Recent History</h2>
          <div className="space-y-1">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                className={`
                  block px-3 py-2 rounded-md text-sm truncate transition-colors
                  ${id === conv.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
                onClick={() => window.innerWidth < 768 && setIsOpen(false)}
              >
                {conv.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-800 space-y-2 min-w-[250px]">
          <Link to="/premium" className="flex items-center gap-3 px-3 py-2 text-sm text-yellow-500 hover:bg-gray-800 rounded-md transition-colors">
            👑 Go Pro Free
          </Link>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
                                          
