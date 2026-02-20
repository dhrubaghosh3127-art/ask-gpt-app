import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage } from '../components/ChatMessage';
import { useConversations } from '../hooks/useConversations';
import { sendMessageToAPI } from '../services/api';
import { Message, Role } from '../types';

export const ChatPage: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    updateConversation,
    deleteConversation,
  } = useConversations();

  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)
    : undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let conv = conversation;
    if (!conv) {
      const newConv = createNewConversation();
      conv = newConv;
    }
    if (!conv) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conv.messages, userMessage];
    updateConversation(conv.id, { messages: updatedMessages });
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAPI([...updatedMessages]);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: aiResponse,
        timestamp: Date.now(),
      };
      updateConversation(conv.id, { messages: [...updatedMessages, aiMessage] });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (messageId: string, newContent: string) => {
    if (!conversation) return;
    const updatedMessages = conversation.messages.map((msg) =>
      msg.id === messageId ? { ...msg, content: newContent } : msg
    );
    updateConversation(conversation.id, { messages: updatedMessages });
    setEditingMessageId(null);
  };

  const handleDelete = (messageId: string) => {
    if (!conversation) return;
    const updatedMessages = conversation.messages.filter((msg) => msg.id !== messageId);
    updateConversation(conversation.id, { messages: updatedMessages });
  };

  const handleRegenerate = async () => {
    if (!conversation || conversation.messages.length === 0 || isLoading) return;

    const lastUserMessageIndex = [...conversation.messages].reverse().findIndex(
      (msg) => msg.role === Role.USER
    );
    if (lastUserMessageIndex === -1) return;

    const actualIndex = conversation.messages.length - 1 - lastUserMessageIndex;
    const messagesUpToUser = conversation.messages.slice(0, actualIndex + 1);

    setIsLoading(true);
    try {
      const aiResponse = await sendMessageToAPI(messagesUpToUser);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: aiResponse,
        timestamp: Date.now(),
      };
      updateConversation(conversation.id, { messages: [...messagesUpToUser, aiMessage] });
    } catch (error) {
      console.error('Failed to regenerate response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageWithLabel = (message: Message) => {
    if (message.role === Role.MODEL) {
      return (
        <div key={message.id} className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1 ml-4">ASK-GPT</div>
          <ChatMessage
            message={message}
            isEditing={editingMessageId === message.id}
            onEdit={(newContent) => handleEdit(message.id, newContent)}
            onDelete={() => handleDelete(message.id)}
            onRegenerate={handleRegenerate}
          />
        </div>
      );
    }

    return (
      <ChatMessage
        key={message.id}
        message={message}
        isEditing={editingMessageId === message.id}
        onEdit={(newContent) => handleEdit(message.id, newContent)}
        onDelete={() => handleDelete(message.id)}
        onRegenerate={handleRegenerate}
      />
    );
  };

  const Background = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="relative flex flex-col h-screen overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-100 to-purple-200" />
        {/* Extra glow blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute top-28 -right-28 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        {/* Glass overlay */}
        <div className="absolute inset-0 backdrop-blur-xl" />
        {/* Content */}
        <div className="relative z-10 flex flex-col h-screen">{children}</div>
      </div>
    );
  };

  // EMPTY STATE UI (Screenshot style)
  if (!conversation || conversation.messages.length === 0) {
    return (
      <Background>
        <Header
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
        />

        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-28">
          <div className="mx-auto w-full max-w-md">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                Welcome to ASK-GPT
              </h1>
              <p className="mt-2 text-lg text-gray-700">How can I assist you today?</p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-4 py-2 shadow-sm backdrop-blur-md">
                <span className="text-sm font-medium text-gray-800">👑 Developer: Prohor (Boss)</span>
              </div>
            </div>

            {/* Demo chat bubbles */}
            <div className="mt-8 space-y-5">
              {/* USER 1 */}
              <div className="flex justify-end">
                <div className="max-w-[78%]">
                  <div className="rounded-2xl rounded-br-md bg-blue-500/90 px-4 py-3 text-white shadow-sm">
                    Hello! How are you?
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-600">
                    <span>Just now</span>
                    <span className="text-blue-600">✓✓</span>
                  </div>
                </div>
              </div>

              {/* AI 1 */}
              <div className="flex justify-start">
                <div className="max-w-[82%]">
                  <div className="mb-1 ml-3 text-xs font-medium text-gray-600">ASK-GPT</div>
                  <div className="rounded-2xl rounded-tl-md bg-white/70 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md">
                    Hi! I&apos;m doing well, thank you. How can I assist you today?
                  </div>
                  <div className="mt-1 ml-3 text-xs text-gray-600">Just now</div>
                </div>
              </div>

              {/* USER 2 */}
              <div className="flex justify-end">
                <div className="max-w-[78%]">
                  <div className="rounded-2xl rounded-br-md bg-blue-500/90 px-4 py-3 text-white shadow-sm">
                    Translate &quot;How are you?&quot; to Spanish.
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-600">
                    <span>Just now</span>
                    <span className="text-blue-600">✓✓</span>
                  </div>
                </div>
              </div>

              {/* AI 2 */}
              <div className="flex justify-start">
                <div className="max-w-[82%]">
                  <div className="mb-1 ml-3 text-xs font-medium text-gray-600">ASK-GPT</div>
                  <div className="rounded-2xl rounded-tl-md bg-white/70 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md">
                    Certainly! The phrase &quot;How are you?&quot; translates to Spanish as ¿Como estas?
                  </div>
                  <div className="mt-1 ml-3 text-xs text-gray-600">Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fixed area like screenshot */}
        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto w-full max-w-md px-4 pb-5">
            <div className="rounded-3xl bg-white/45 p-3 shadow-lg backdrop-blur-xl border border-white/40">
              {/* Input bar */}
              <div className="flex items-center gap-2 rounded-full bg-white/55 px-4 py-3 border border-white/50">
                {/* paperclip */}
                <button
                  type="button"
                  className="text-gray-600 active:scale-95 transition"
                  aria-label="Attach"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder="Ask anything..."
                  disabled
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
                />

                {/* send */}
                <button
                  type="button"
                  className="text-blue-600 active:scale-95 transition"
                  aria-label="Send"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
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

              {/* Disclaimer */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600">
                  ASK-GPT can make mistakes. Verify important information.
                </p>
                <p className="mt-1 text-xs text-gray-500">Free Tier v1</p>
              </div>
            </div>
          </div>
  </
