import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import { Conversation, Message, Role } from '../types';
import { getConversations, saveConversations } from '../utils/storage';
import { getGeminiResponse } from '../services/geminiService';
import { MODELS } from '../constants';

interface ChatPageProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversations = getConversations();
    if (id) {
      const found = conversations.find((c) => c.id === id);
      if (found) {
        setConversation(found);
      } else {
        navigate('/');
      }
    } else {
      setConversation(null);
    }
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isLoading]);

  const updateConversation = (newMessages: Message[]) => {
    const conversations = getConversations();
    const currentId = id || Date.now().toString();

    const updatedConv: Conversation = conversation
      ? { ...conversation, messages: newMessages, lastUpdated: Date.now() }
      : {
          id: currentId,
          title:
            newMessages[0].content.slice(0, 30) +
            (newMessages[0].content.length > 30 ? '...' : ''),
          messages: newMessages,
          lastUpdated: Date.now(),
        };

    const updatedList = conversations.filter((c) => c.id !== currentId);
    saveConversations([updatedConv, ...updatedList]);
    setConversation(updatedConv);
    if (!id) navigate(`/${currentId}`);
  };

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(conversation?.messages || []), userMessage];
    updateConversation(updatedMessages);
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(content, updatedMessages, selectedModel);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: response,
        timestamp: Date.now(),
      };

      updateConversation([...updatedMessages, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content:
          'Error: Could not connect to Gemini API. Please check your network or API key configuration.',
        timestamp: Date.now(),
      };
      updateConversation([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = !conversation || conversation.messages.length === 0;

  return (
    <div className="relative flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
      {/* Soft iOS-like background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-100 to-purple-200" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-300/40 blur-3xl" />
        <div className="absolute -top-16 -right-24 h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <Header toggleSidebar={toggleSidebar} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto py-12 flex flex-col items-center">
          {isEmpty ? (
            <div className="w-full px-4">
              {/* Welcome (ONLY empty state) */}
              <div className="text-center mb-8 px-2">
                <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
                  Welcome to ASK-GPT
                </h1>
                <p className="text-[17px] text-gray-500 font-medium mb-5">
                  How can I assist you today?
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-full shadow-sm">
                  <span className="text-sm">👑</span>
                  <span className="text-[13px] font-semibold text-gray-600">
                    Developer: Prohor (Boss)
                  </span>
                </div>
              </div>

              {/* Demo bubbles (ONLY empty state) */}
              <div className="w-full space-y-5 pb-44">
                {/* USER 1 */}
                <div className="flex justify-end">
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-br-md bg-blue-500/25 text-gray-900 px-5 py-3 shadow-sm backdrop-blur-sm border border-white/40">
                      Hello! How are you?
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                      <span>Just now</span>
                      <span className="text-blue-500">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* AI 1 */}
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    <div className="mb-1 ml-1 text-xs font-semibold text-gray-600">ASK-GPT</div>
                    <div className="rounded-2xl rounded-tl-md bg-white/70 text-gray-900 px-5 py-3 shadow-sm backdrop-blur-sm border border-white/60">
                      Hi! I'm doing well, thank you. How can I assist you today?
                    </div>
                    <div className="mt-1 ml-1 text-xs text-gray-500">Just now</div>
                  </div>
                </div>

                {/* USER 2 */}
                <div className="flex justify-end">
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-br-md bg-blue-500/25 text-gray-900 px-5 py-3 shadow-sm backdrop-blur-sm border border-white/40">
                      Translate &quot;How are you?&quot; to Spanish.
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                      <span>Just now</span>
                      <span className="text-blue-500">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* AI 2 */}
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    <div className="mb-1 ml-1 text-xs font-semibold text-gray-600">ASK-GPT</div>
                    <div className="rounded-2xl rounded-tl-md bg-white/70 text-gray-900 px-5 py-3 shadow-sm backdrop-blur-sm border border-white/60">
                      Certainly! The phrase &quot;How are you?&quot; translates to Spanish as ¿Como estas?
                    </div>
                    <div className="mt-1 ml-1 text-xs text-gray-500">Just now</div>
                  </div>
                </div>
              </div>

              {/* Fixed empty-state input + disclaimer (UI only) */}
              <div className="fixed inset-x-0 bottom-0 z-20">
                <div className="mx-auto max-w-3xl px-4 pb-4">
                  <div className="rounded-3xl bg-white/45 backdrop-blur-md border border-white/60 shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2 rounded-full bg-white/55 border border-white/60 px-4 py-3">
                      <button type="button" className="text-gray-600 active:scale-95 transition" aria-label="Attach">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01" />
                        </svg>
                      </button>

                      <input
                        type="text"
                        placeholder="Ask anything..."
                        disabled
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
                      />

                      <button type="button" className="text-blue-600 active:scale-95 transition" aria-label="Send">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-600">ASK-GPT can make mistakes. Verify important information.</p>
                      <p className="mt-1 text-xs text-gray-500">Free Tier v1</p>
                    </div>
                  </div>

                  {/* Footer Badge */}
                  <div className="mt-3">
                    <button className="w-full flex items-center justify-between px-5 py-3.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm hover:bg-white/60 transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👑</span>
                        <span className="text-[14px] font-bold text-gray-700">Developer: Prohor (Boss)</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full pb-28">
              {/* Real messages */}
              {conversation.messages.map((msg) => (
                <div key={msg.id} className="px-4 mb-4">
                  {msg.role === Role.MODEL && (
                    <div className="mb-1 ml-1 text-xs font-semibold text-gray-600">ASK-GPT</div>
                  )}
                  <ChatMessage message={msg} />
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="px-4 mb-6">
                  <div className="mb-1 ml-1 text-xs font-semibold text-gray-600">ASK-GPT</div>
                  <div className="inline-block rounded-2xl rounded-tl-md bg-white/70 px-5 py-3 border border-white/60 shadow-sm backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Real input only when not empty */}
      {!isEmpty && <ChatInput onSend={handleSend} isLoading={isLoading} />}

      {/* Footer badge only when not empty (empty state has its own fixed footer) */}
      {!isEmpty && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <button className="w-full flex items-center justify-between px-5 py-3.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm hover:bg-white/60 transition-all group">
              <div className="flex items-center gap-3">
                <span className="text-lg">👑</span>
                <span className="text-[14px] font-bold text-gray-700">Developer: Prohor (Boss)</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
