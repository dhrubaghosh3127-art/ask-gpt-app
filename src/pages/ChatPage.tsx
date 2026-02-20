import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Conversation, Message, Role } from '../types';
import { getConversations, saveConversations } from '../utils/storage';
import { getGeminiResponse } from '../services/geminiService';
import { MODELS } from '../constants';
import { IoSend, IoAttachOutline, IoChevronForward } from 'react-icons/io5';

interface ChatPageProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ id: propId }) => {
  const { id: urlId } = useParams();
  const id = urlId || propId;
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedModel] = useState(MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversations = getConversations();
    if (id) {
      const found = conversations.find(c => c.id === id);
      if (found) setConversation(found);
    } else {
      setConversation(null);
    }
  }, [id]);

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
          title: newMessages[0].content.slice(0, 30), 
          messages: newMessages, 
          lastUpdated: Date.now() 
        };

    const updatedList = conversations.filter(c => c.id !== currentId);
    saveConversations([updatedConv, ...updatedList]);
    setConversation(updatedConv);
    if (!id) navigate(`/chat/${currentId}`);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: inputText,
      timestamp: Date.now()
    };

    const updatedMessages = [...(conversation?.messages || []), userMessage];
    updateConversation(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(inputText, updatedMessages, selectedModel);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: response,
        timestamp: Date.now()
      };
      updateConversation([...updatedMessages, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F3F0FF] font-sans overflow-hidden">
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-32">
        {/* Welcome Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-[32px] font-bold text-[#1A1C2E] mb-1">Welcome to ASK-GPT</h1>
          <p className="text-[#4B4E6D] text-lg mb-4">How can I assist you today?</p>
          
          <div className="flex items-center bg-white/60 px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
            <span className="text-yellow-500 mr-2">👑</span>
            <span className="text-gray-600 text-sm">Developer: <span className="font-medium">Prohor (Boss)</span></span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="max-w-2xl mx-auto space-y-6">
          {conversation?.messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed
                  ${msg.role === Role.USER 
                    ? 'bg-[#E0E7FF] text-[#1A1C2E] rounded-tr-none' 
                    : 'bg-white text-[#1A1C2E] rounded-tl-none border border-gray-100'
                  }`}
              >
                {msg.content}
              </div>
              <div className="flex items-center mt-1 px-1">
                <span className="text-[11px] text-gray-400">Just now</span>
                {msg.role === Role.USER && <span className="ml-1 text-[#8B8D98] text-xs">✓✓</span>}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom UI */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 bg-gradient-to-t from-[#F3F0FF] via-[#F3F0FF] to-transparent">
        <div className="max-w-2xl mx-auto">
          {/* Input Bar */}
          <div className="relative flex items-center bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <IoAttachOutline size={24} />
            </button>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-[#1A1C2E] placeholder-gray-400"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`p-2 rounded-xl transition-colors ${inputText.trim() ? 'bg-[#7C3AED] text-white' : 'text-blue-200'}`}
            >
              <IoSend size={20} />
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-tight">
              ASK-GPT can make mistakes. Verify important information.
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Free Tier v1
            </p>
          </div>

          {/* Bottom Developer Navigation Bar */}
          <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2 text-sm">👑</span>
              <span className="text-gray-600 text-sm">Developer: <span className="font-medium">Prohor (Boss)</span></span>
            </div>
            <IoChevronForward className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
