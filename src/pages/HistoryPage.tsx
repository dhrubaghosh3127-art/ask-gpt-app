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
        <div className="space-y-4">
          <button
            type="button"
            onClick={openNewChat}
            className="w-full rounded-[22px] border border-[#ececf2] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
              New chat
            </div>
          </button>

          <div className="overflow-hidden rounded-[22px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div>
                <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
                  Archived chat
                </div>
                <div className="mt-1 text-[13px] text-[#8a8a8f]">
                  {archivedChats.length} archived chat{archivedChats.length === 1 ? '' : 's'}
                </div>
              </div>
            </button>

            <div className="h-px bg-[#f0f1f5]" />

            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div>
                <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
                  Upgrade to ASK-GPT Plus
                </div>
                <div className="mt-1 text-[13px] text-[#8a8a8f]">
                  Premium features coming soon
                </div>
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
            onClick={() => openChat(chat.id)}
            className="block w-full px-5 py-4 text-left"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#111111]">
              {chat.title}
            </div>
          </button>
          {index !== activeChats.length - 1 && <div className="h-px bg-[#f0f1f5]" />}
        </React.Fragment>
      ))
    )}
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
