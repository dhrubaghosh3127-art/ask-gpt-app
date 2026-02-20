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
  }, [conversation?.messages]);

  const updateConversation = (newMessages: Message[]) => {
    if (!conversation && !id) return;
    
    const conversations = getConversations();
    const currentId = id || Date.now().toString();
    
    const updatedConv: Conversation = conversation 
      ? { ...conversation, messages: newMessages, lastUpdated: Date.now() }
      : { 
          id: currentId, 
          title: newMessages[0].content.slice(0, 30) + (newMessages[0].content.length > 30 ? '...' : ''), 
          messages: newMessages, 
          lastUpdated: Date.now() 
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
      timestamp: Date.now()
    };

    const updatedMessages = [...(conversation?.messages || []), userMessage];
    updateConversation(updatedMessages);
    setIsLoading(true);

    try {
      const tool = TOOL_CATEGORIES.find(t => t.id === conversation?.category);
      const systemPrompt = tool ? tool.prompt : '';
      
      const response = await getGeminiResponse(content, updatedMessages, selectedModel, systemPrompt);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: response,
        timestamp: Date.now()
      };

      updateConversation([...updatedMessages, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: "Error: Could not connect to Gemini API. Please check your network or API key configuration.",
        timestamp: Date.now()
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
    const lastUserIndex = [...conversation.messages].reverse().findIndex(m => m.role === Role.USER);
    if (lastUserIndex === -1) return;
    
    const realIndex = conversation.messages.length - 1 - lastUserIndex;
    const previousMessages = conversation.messages.slice(0, realIndex + 1);
    const lastUserPrompt = conversation.messages[realIndex].content;
    
    setIsLoading(true);
    try {
      const response = await getGeminiResponse(lastUserPrompt, previousMessages, selectedModel);
      const botMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: response,
        timestamp: Date.now()
      };
      updateConversation([...previousMessages, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header 
        toggleSidebar={toggleSidebar} 
        selectedModel={selectedModel} 
        setSelectedModel={setSelectedModel} 
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="h-full flex flex-col items-center justify-start px-4 sm:px-8 pt-10 pb-28 text-center">
  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
    Welcome to{" "}
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
      ASK-GPT
    </span>
  </h1>

  <p className="mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
    How can I assist you today?
  </p>

  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
    <span className="text-lg">👑</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
      Developer: Prohor (Boss)
    </span>
  </div>

  <div className="mt-8 w-full max-w-xl space-y-5">
    {/* USER (Right) */}
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="px-4 py-3 rounded-2xl rounded-br-md bg-blue-600/15 dark:bg-blue-500/20 text-gray-900 dark:text-gray-100 shadow-sm border border-blue-600/10">
          Hello! How are you?
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          Just now ✓✓
        </div>
      </div>
    </div>

    {/* AI (Left) */}
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ml-2">
          ASK-GPT
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/80 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/70 dark:border-gray-700/60">
          Hi! I'm doing well, thank you. How can I assist you today?
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left ml-2">
          Just now
        </div>
      </div>
    </div>

    {/* USER (Right) */}
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="px-4 py-3 rounded-2xl rounded-br-md bg-blue-600/15 dark:bg-blue-500/20 text-gray-900 dark:text-gray-100 shadow-sm border border-blue-600/10">
          Translate "How are you?" to Spanish.
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          Just now ✓✓
        </div>
      </div>
    </div>

    {/* AI (Left) */}
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ml-2">
          ASK-GPT
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/80 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/70 dark:border-gray-700/60">
          Certainly! The phrase "How are you?" translates to Spanish as{" "}
          <span className="font-semibold">"¿Cómo estás?"</span>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left ml-2">
          Just now
        </div>
      </div>
    </div>
  </div>

  <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
    ASK-GPT can make mistakes. Verify important information.{" "}
    <span className="opacity-80">Free Tier v1</span>
  </p>
</div>
        ) : (
          <div className="pb-20">
            {conversation.messages.map((msg, idx) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onRegenerate={idx === conversation.messages.length - 1 && msg.role === Role.MODEL ? handleRegenerate : undefined}
              />
            ))}
            {isLoading && (
              <div className="py-8 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-3xl mx-auto px-4 flex gap-6">
                  <div className="w-8 h-8 rounded shrink-0 bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                    G
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default ChatPage;
  
