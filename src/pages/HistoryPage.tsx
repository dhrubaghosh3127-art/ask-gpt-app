import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import {
  archiveConversation,
  deleteConversation,
  getActiveConversations,
  getArchivedConversations,
  getConversations,
  pinConversation,
  renameConversation,
  saveConversations,
  unpinConversation,
} from '../utils/storage';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeChats, setActiveChats] = useState<Conversation[]>([]);
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);
  const [menuChat, setMenuChat] = useState<Conversation | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const suppressOpenRef = useRef(false);

  const refreshChats = () => {
    const active = getActiveConversations().sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
      return b.lastUpdated - a.lastUpdated;
    });

    const archived = getArchivedConversations().sort((a, b) => b.lastUpdated - a.lastUpdated);

    setActiveChats(active);
    setArchivedChats(archived);
  };

  useEffect(() => {
    refreshChats();
  }, []);

  const openChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const openNewChat = () => {
    const newId = Date.now().toString();

    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now(),
      archived: false,
      pinned: false,
    };

    const updated = [newConv, ...getConversations()];
    saveConversations(updated);
    navigate(`/chat/${newId}`);
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
    refreshChats();
  };

  const handleArchive = () => {
    if (!menuChat) return;
    archiveConversation(menuChat.id);
    setMenuChat(null);
    refreshChats();
  };

  const handlePinToggle = () => {
    if (!menuChat) return;
    if (menuChat.pinned) {
      unpinConversation(menuChat.id);
    } else {
      pinConversation(menuChat.id);
    }
    setMenuChat(null);
    refreshChats();
  };

  const handleDelete = () => {
    if (!menuChat) return;
    const ok = window.confirm(`Delete "${menuChat.title}"?`);
    if (!ok) return;
    deleteConversation(menuChat.id);
    setMenuChat(null);
    refreshChats();
  };

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-5 pt-8 pb-10">
       <div className="space-y-2">
  <button
    type="button"
    onClick={openNewChat}
    className="w-full rounded-[20px] bg-[#f7f7f8] px-4 py-4 text-left"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
      New chat
    </div>
  </button>

  <button
    type="button"
    onClick={() => navigate('/history/archived')}
    className="w-full rounded-[20px] bg-[#f7f7f8] px-4 py-4 text-left"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
      Archived chat
    </div>
    <div className="mt-1 text-[12px] text-[#8a8a8f]">
      {archivedChats.length} archived chat{archivedChats.length === 1 ? '' : 's'}
    </div>
  </button>

  <button
    type="button"
    className="w-full rounded-[20px] bg-[#f7f7f8] px-4 py-4 text-left"
    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
  >
    <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
      Upgrade to ASK-GPT Plus
    </div>
    <div className="mt-1 text-[12px] text-[#8a8a8f]">
      Premium features coming soon
    </div>
  </button>
</div> 

          <div className="pt-3">
            <div
              className="mb-3 px-1 text-[15px] font-semibold tracking-[-0.01em] text-[#111111]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              Your ASK-GPT history
            </div>

      <div className="h-[420px] overflow-hidden rounded-[22px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
  <div className="h-full overflow-y-auto">
    {activeChats.length === 0 ? (
      <div
        className="px-5 py-5 text-[14px] text-[#8a8a8f]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        No chat history yet
      </div>
    ) : (
      activeChats.map((chat, index) => (
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
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#111111]">
                {chat.title}
              </div>
              {chat.pinned && (
                <span className="shrink-0 text-[12px] font-medium text-[#8a8a8f]">
                  Pinned
                </span>
              )}
            </div>
          </button>
          {index !== activeChats.length - 1 && <div className="h-px bg-[#f0f1f5]" />}
        </React.Fragment>
      ))
    )}
  </div>
</div>

{menuChat && (
  <div className="fixed inset-0 z-[60]">
    <button
      type="button"
      aria-label="Close menu"
      onClick={() => setMenuChat(null)}
      className="absolute inset-0 bg-black/10"
    />

    <div className="absolute left-1/2 bottom-6 w-[calc(100%-40px)] max-w-[360px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#ececf2] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <button
        type="button"
        onClick={handleRename}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">Rename</span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handleArchive}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">Archive</span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handlePinToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">
          {menuChat.pinned ? 'Unpin chat' : 'Pin chat'}
        </span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handleDelete}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#e53935]">Delete</span>
      </button>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
