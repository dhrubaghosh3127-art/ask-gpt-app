import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  

  useEffect(() => {
    setConversations(getConversations());
  }, [isOpen]);

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
  transition-all duration-300 ease-in-out bg-white text-[#111111] h-full flex flex-col overflow-hidden relative z-50
  md:relative absolute border-r border-[#ececf2]
`}>
  <div className="p-5 flex flex-col h-full bg-white">
    {/* Header */}
    <div className="mb-6 min-w-[250px] space-y-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-[24px] font-bold tracking-[-0.03em] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          ASK-GPT
        </h1>

        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden h-[42px] w-[42px] rounded-full border border-[#ececf2] bg-white text-[26px] leading-none text-[#111111] shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
        >
          ×
        </button>
      </div>

      <button
  type="button"
  className="w-full rounded-[20px] border border-[#ececf2] bg-white px-5 py-3.5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
    My Profile
  </div>
</button>

      <button
  type="button"
  className="w-full rounded-[20px] border border-[#d9edf9] bg-[#eaf7ff] px-5 py-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
    Upgrade to ASK-GPT Plus
  </div>
</button>
    </div>
{/* Tools Section */}
<div className="mb-5 min-w-[250px] space-y-2.5">
  <h2
    className="px-1 text-[12px] font-semibold uppercase tracking-[0.11em] text-[#9aa0aa]"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    Categories
  </h2>

  {[
    TOOL_CATEGORIES.slice(0, 4),
    TOOL_CATEGORIES.slice(4, 8),
  ].map((group, groupIndex) => (
    <div
      key={groupIndex}
      className="rounded-[22px] border border-[#ececf2] bg-[#fbfbfd] p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <div className="grid grid-cols-2 gap-2">
        {group.map((cat) => (
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
    className="flex min-w-0 items-center gap-2 rounded-full border border-[#ececf2] bg-white px-3 py-3 text-left transition-all hover:bg-[#f7f7fa]"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    <span className="shrink-0 text-[16px] leading-none opacity-85">{cat.icon}</span>
    <span className="min-w-0 truncate text-[13px] font-semibold tracking-[-0.02em] text-[#111111]">
      {cat.name}
    </span>
  </button>
))}
      </div>
    </div>
  ))}
</div>

{/* Footer */}
<div className="pt-4 border-t border-[#ececf2] space-y-1 min-w-[250px]">

  <Link
  to="/key"
  className="w-full flex items-center gap-3 px-2 py-2 text-[14px] text-[#111111] hover:bg-[#f5f5f7] rounded-lg"
>
  🔑 Your API Key
</Link>

  <button className="w-full flex items-center gap-3 px-2 py-2 text-[14px] text-[#111111] hover:bg-[#f5f5f7] rounded-lg">
    ⚙ Settings & Support
  </button>

  <button className="w-full flex items-center gap-3 px-2 py-2 text-[14px] text-[#111111] hover:bg-[#f5f5f7] rounded-lg">
    📜 Privacy Policy
  </button>

  <button className="w-full flex items-center gap-3 px-2 py-2 text-[14px] text-red-500 hover:bg-[#f5f5f7] rounded-lg">
    ⎋ Log out
  </button>

</div>
      </div>
    </div>
  );
};

export default Sidebar;
                                          
