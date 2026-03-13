import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import { getArchivedConversations } from '../utils/storage';

const ArchivedPage: React.FC = () => {
  const navigate = useNavigate();
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);

  useEffect(() => {
    const archived = getArchivedConversations().sort((a, b) => b.lastUpdated - a.lastUpdated);
    setArchivedChats(archived);
  }, []);

  const openChat = (id: string) => {
    navigate(`/chat/${id}`);
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
            onClick={() => openChat(chat.id)}
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
</div>
      </div>
    </div>
  );
};

export default ArchivedPage;
