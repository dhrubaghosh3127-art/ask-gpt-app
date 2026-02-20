import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import { Conversation, Message, Role } from '../types';
import { getConversations, saveConversations } from '../utils/storage';
import { getGeminiResponse } from '../services/geminiService';
import { TOOL_CATEGORIES, MODELS } from '../constants';

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

  // Empty-state input (UI only, but we can send using handleSend)
  const [emptyDraft, setEmptyDraft] = useState('');

  useEffect(() => {
    const conversations = getConversations();
    if (id) {
      const found = conversations.find(c => c.id === id);
      if (found) {
        setConversation(found);
      } else {
        navigate('/chat');
      }
    } else {
      setConversation(null);
    }
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isLoading]);

  const updateConversation = (newMessages: Message[]) => {
    if (!conversation && !id) return;

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

    const updatedList = conversations.filter(c => c.id !== currentId);
    saveConversations([updatedConv, ...updatedList]);
    setConversation(updatedConv);
    if (!id) navigate(`/chat/${currentId}`);
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
      const tool = TOOL_CATEGORIES.find(t => t.id === conversation?.category);
      const systemPrompt = tool ? tool.prompt : '';

      const response = await getGeminiResponse(
        content,
        updatedMessages,
        selectedModel,
        systemPrompt
      );

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

  const handleDeleteMessage = (msgId: string) => {
    if (!conversation) return;
    const filtered = conversation.messages.filter(m => m.id !== msgId);
    updateConversation(filtered);
  };

  const handleEditMessage = async (msgId: string, newContent: string) => {
    if (!conversation) return;
    const updated = conversation.messages.map(m =>
      m.id === msgId ? { ...m, content: newContent } : m
    );
    updateConversation(updated);
  };

  const handleRegenerate = async () => {
    if (!conversation || conversation.messages.length < 2) return;
    const lastUserIndex = [...conversation.messages]
      .reverse()
      .findIndex(m => m.role === Role.USER);
    if (lastUserIndex === -1) return;

    const realIndex = conversation.messages.length - 1 - lastUserIndex;
    const previousMessages = conversation.messages.slice(0, realIndex + 1);
    const lastUserPrompt = conversation.messages[realIndex].content;

    setIsLoading(true);
    try {
      const response = await getGeminiResponse(
        lastUserPrompt,
        previousMessages,
        selectedModel
      );
      const botMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: response,
        timestamp: Date.now(),
      };
      updateConversation([...previousMessages, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = !conversation || conversation.messages.length === 0;

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* Soft blurred gradient background (iOS style) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-100 via-blue-100 to-purple-200" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-300/40 blur-3xl" />
      <div className="absolute top-28 -right-24 h-80 w-80 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="absolute bottom-20 left-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute inset-0 -z-10 backdrop-blur-xl" />

      <Header
        toggleSidebar={toggleSidebar}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isEmpty ? (
          <div className="relative h-full">
            {/* Content */}
            <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-40">
              {/* Welcome */}
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                  Welcome to ASK-GPT
                </h1>
                <p className="mt-2 text-lg sm:text-xl text-gray-700">
                  How can I assist you today?
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-5 py-2 shadow-sm backdrop-blur-md">
                  <span className="text-sm font-medium text-gray-800">
                    👑 Developer: Prohor (Boss)
                  </span>
                </div>
              </div>

              {/* Demo chat bubbles (exact like screenshot) */}
              <div className="mt-10 space-y-6">
                {/* USER 1 */}
                <div className="flex justify-end">
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-br-md bg-blue-500/25 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md border border-white/40">
                      Hello! How are you?
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-600">
                      <span>Just now</span>
                      <span className="text-blue-600">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* AI 1 */}
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    <div className="mb-1 ml-1 text-xs font-medium text-gray-700">
                      ASK-GPT
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-white/65 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md border border-white/50">
                      Hi! I'm doing well, thank you. How can I assist you today?
                    </div>
                    <div className="mt-1 ml-1 text-xs text-gray-600">Just now</div>
                  </div>
                </div>

                {/* USER 2 */}
                <div className="flex justify-end">
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-br-md bg-blue-500/25 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md border border-white/40">
                      Translate &quot;How are you?&quot; to Spanish.
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-600">
                      <span>Just now</span>
                      <span className="text-blue-600">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* AI 2 */}
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    <div className="mb-1 ml-1 text-xs font-medium text-gray-700">
                      ASK-GPT
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-white/65 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md border border-white/50">
                      Certainly! The phrase &quot;How are you?&quot; translates to Spanish as
                      &nbsp;¿Como estas?
                    </div>
                    <div className="mt-1 ml-1 text-xs text-gray-600">Just now</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom fixed area (iOS-like) */}
            <div className="fixed inset-x-0 bottom-0 z-20">
              <div className="mx-auto w-full max-w-3xl px-4 pb-5">
                <div className="rounded-3xl bg-white/45 p-3 shadow-lg backdrop-blur-xl border border-white/50">
                  <div className="flex items-center gap-2 rounded-full bg-white/55 px-4 py-3 border border-white/50">
                    {/* paperclip */}
                    <button
                      type="button"
                      className="text-gray-700 active:scale-95 transition"
                      aria-label="Attach"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01"
                        />
                      </svg>
                    </button>

                    <input
                      value={emptyDraft}
                      onChange={(e) => setEmptyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const v = emptyDraft.trim();
                          if (!v) return;
                          setEmptyDraft('');
                          handleSend(v);
                        }
                      }}
                      placeholder="Ask anything..."
                      className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
                    />

                    {/* send */}
                    <button
                      type="button"
                      onClick={() => {
                        const v = emptyDraft.trim();
                        if (!v) return;
                        setEmptyDraft('');
                        handleSend(v);
                      }}
                      className="text-blue-600 active:scale-95 transition"
                      aria-label="Send"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-700">
                      ASK-GPT can make mistakes. Verify important information.
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Free Tier v1</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/35 px-4 py-3 border border-white/45">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <span>👑</span>
                      <span className="font-medium">Developer: Prohor (Boss)</span>
                    </div>
                    <div className="text-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-28">
            {/* Real chat */}
            <div className="mx-auto w-full max-w-3xl px-4 pt-4">
              {conversation.messages.map((msg, idx) => {
                const isAI = msg.role === Role.MODEL;
                return (
                  <div key={msg.id} className="mb-3">
                    {isAI && (
                      <div className="mb-1 ml-2 text-xs font-medium text-gray-700">
                        ASK-GPT
                      </div>
                    )}
                    <ChatMessage
                      message={msg}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onRegenerate={
                        idx === conversation.messages.length - 1 && msg.role === Role.MODEL
                          ? handleRegenerate
                          : undefined
                      }
                    />
                  </div>
                );
              })}

              {/* Typing indicator (ASK-GPT label + bubble) */}
              {isLoading && (
                <div className="mb-4">
                  <div className="mb-1 ml-2 text-xs font-medium text-gray-700">ASK-GPT</div>
                  <div className="inline-flex max-w-[78%] rounded-2xl rounded-tl-md bg-white/65 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md border border-white/50">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-500/70 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-gray-500/70 animate-bounce [animation-delay:0.18s]" />
                      <span className="h-2 w-2 rounded-full bg-gray-500/70 animate-bounce [animation-delay:0.36s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom real input (kept for actual chat) */}
      {!isEmpty && (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto w-full max-w-3xl px-4 pb-5">
            <div className="rounded-3xl bg-white/45 p-3 shadow-lg backdrop-blur-xl border border-white/50">
              <ChatInput onSend={handleSend} isLoading={isLoading} />
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-700">
                  ASK-GPT can make mistakes. Verify important information.
                </p>
                <p className="mt-1 text-xs text-gray-600">Free Tier v1</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
```0
