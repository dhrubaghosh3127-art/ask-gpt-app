import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import {
  getArchivedConversations,
  pinConversation,
  renameConversation,
  unarchiveConversation,
} from '../utils/storage';

const ArchivedPage: React.FC = () => {
  const navigate = useNavigate();
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);
  const [menuChat, setMenuChat] = useState<Conversation | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const suppressOpenRef = useRef(false);

  const refreshArchived = () => {
    const archived = getArchivedConversations().sort((a, b) => b.lastUpdated - a.lastUpdated);
    setArchivedChats(archived);
  };

  useEffect(() => {
    refreshArchived();
  }, []);

  const openChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const clearLongPress = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startLongPress = (chat: Conversation) => {
    clearLongPress();
    holdTimerRef.current = window.setTimeout(() => {
      suppressOpenRef.current = true;
      setMenuChat(chat);
    }, 420);
  };

  const handleChatPress = (chat: Conversation) => {
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false;
      return;
    }
    openChat(chat.id);
  };

  const handleRename = () => {
    if (!menuChat) return;
    const nextTitle = window.prompt('Rename chat', menuChat.title);
    if (!nextTitle || !nextTitle.trim()) return;
    renameConversation(menuChat.id, nextTitle);
    setMenuChat(null);
    refreshArchived();
  };

  const handleUnarchive = () => {
    if (!menuChat) return;
    unarchiveConversation(menuChat.id);
    setMenuChat(null);
    refreshArchived();
  };

  const handlePin = () => {
    if (!menuChat) return;
    pinConversation(menuChat.id);
    setMenuChat(null);
    refreshArchived();
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-5 pt-8 pb-10">
        <div
          className="mb-4 text-[24px] font-bold tracking-[-0.03em] text-[#111111]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
        >
          Archived chat
        </div>

        <div className="h-[420px] overflow-hidden rounded-[22px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
  <div className="h-full overflow-y-auto">
    {archivedChats.length === 0 ? (
      <div
        className="px-5 py-5 text-[14px] text-[#8a8a8f]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        No archived chat yet
      </div>
    ) : (
      archivedChats.map((chat, index) => (
        <React.Fragment key={chat.id}>
          <button
  type="button"
  onClick={() => handleChatPress(chat)}
  onTouchStart={() => startLongPress(chat)}
  onTouchEnd={clearLongPress}
  onTouchMove={clearLongPress}
  onTouchCancel={clearLongPress}
  onMouseDown={() => startLongPress(chat)}
  onMouseUp={clearLongPress}
  onMouseLeave={clearLongPress}
  onContextMenu={(e) => {
    e.preventDefault();
    setMenuChat(chat);
  }}
  className="block w-full px-5 py-4 text-left"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  <div className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#111111]">
    {chat.title}
  </div>
</button>
          {index !== archivedChats.length - 1 && <div className="h-px bg-[#f0f1f5]" />}
        </React.Fragment>
      ))
    )}
  </div>
          {menuChat && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/20"
    onClick={() => setMenuChat(null)}
  >
    <div
      className="w-full max-w-[430px] rounded-t-[28px] bg-white shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleRename}
        className="w-full px-6 py-4 text-left text-[16px] border-b"
      >
        Rename
      </button>

      <button
        onClick={handleUnarchive}
        className="w-full px-6 py-4 text-left text-[16px] border-b"
      >
        Unarchive
      </button>

      <button
        onClick={handlePin}
        className="w-full px-6 py-4 text-left text-[16px]"
      >
        Pin chat
      </button>
    </div>
  </div>
)}
</div>
      </div>
    </div>
  );
};

export default ArchivedPage;
