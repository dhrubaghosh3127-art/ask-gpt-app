import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import { Conversation, Message, Role } from '../types';
import { getConversations, saveConversations, getUserApiKey, getFreeCount, incFreeCount } from '../utils/storage';
import { getGeminiResponse } from '../services/geminiService';
import { TOOL_CATEGORIES, MODELS, DEFAULT_MODEL_ID, HARD_MODEL_ID, VERY_HARD_MODEL_ID } from '../constants';

interface ChatPageProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { id } = useParams();
const navigate = useNavigate();

const [conversation, setConversation] = useState<Conversation | null>(null);
const [isLoading, setIsLoading] = useState(false);

const [isThinking, setIsThinking] = useState(false);
const [thinkingText, setThinkingText] = useState("");
const [thinkingOpen, setThinkingOpen] = useState(true);

const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
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
const isBangla = (text: string) => /[\u0980-\u09FF]/.test(text);
  const AUTO_FLASH_ID = "google/gemini-2.5-flash";
const AUTO_THINK_ID = "deepseek/deepseek-r1";

const shouldUseDeepSeek = (text: string) => {
  const t = (text || "").toLowerCase();
  const hasDigit = /[0-9০-৯]/.test(t);
  const hasOp = /[+\-*/=%×÷]/.test(t);
  const mathTrig = hasDigit && hasOp;

  const mathNotation = /(\^|√|log|ln|sin|cos|tan|∫|sum|sigma|pi|theta|lim)/i.test(t);

  const codeSymbols = /[{}()[\];<>]|==|!=|=>/.test(t);
  const codeKeywords =
    /\b(function|import|export|class|const|let|var|print|printf|console\.log|def|return|if|else|for|while|try|catch|async|await)\b/i.test(t);

  const logicWords = /(বড়|ছোট|তুলনা|কেন|কীভাবে|কারণ|লজিক|বিশ্লেষণ|compare|analysis|why|how)/i.test(t);

  const techWords =
    /\b(error|bug|fix|solution|value|result|traceback|exception|typeerror|syntaxerror|cors|json|api|token|rate limit)\b/i.test(t);

  return mathTrig || mathNotation || codeSymbols || codeKeywords || logicWords || techWords;
};

const pickAutoModelId = (text: string) => (shouldUseDeepSeek(text) ? AUTO_THINK_ID : AUTO_FLASH_ID);
  const THINKING_LINES = [
  "Interpreting the user's request…",
  "Checking details…",
  "Drafting the answer…",
];

const thinkingTimerRef = useRef<number | null>(null);
const thinkingIndexRef = useRef(0);

const startThinking = () => {
  setIsThinking(true);
  setThinkingOpen(true);

  thinkingIndexRef.current = 0;
  setThinkingText(THINKING_LINES[0]);

  if (thinkingTimerRef.current) window.clearInterval(thinkingTimerRef.current);

  thinkingTimerRef.current = window.setInterval(() => {
    thinkingIndexRef.current =
      (thinkingIndexRef.current + 1) % THINKING_LINES.length;
    setThinkingText(THINKING_LINES[thinkingIndexRef.current]);
  }, 1200);
};

const stopThinking = () => {
  if (thinkingTimerRef.current) window.clearInterval(thinkingTimerRef.current);
  thinkingTimerRef.current = null;

  setIsThinking(false);
  setThinkingText("");
};
const limitText = (userText: string) => {
  if (isBangla(userText)) {
    return `✅ আপনার আজকের ফ্রি লিমিট শেষ (৫ মেসেজ)।\n\n⚙️ Settings on করে Unlimited use করতে এখানে ক্লিক করুন: [API Key সেট করুন](#/key)`;
  }
  return `✅ Your free daily limit is reached (5 messages).\n\n⚙️ Turn on settings for unlimited use: [Set API Key](#/key)`;
};



  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now()
    };

   const updatedMessages = [...(conversation?.messages || []), userMessage];
const apiHistory = updatedMessages.slice(-12);
updateConversation(updatedMessages);

 // Free daily limit (userKey ... )
 const userKey = getUserApiKey();
 if (userKey) {
   const count = getFreeCount();
   if (count >= 5) {
     const botMessage: Message = { ... };
     updateConversation([...updatedMessages, botMessage]);
     return;
   }
   incFreeCount();
 }

setIsLoading(true);

    try {
      const tool = TOOL_CATEGORIES.find(t => t.id === conversation?.category);
      const systemPrompt = tool ? tool.prompt : '';
      
      const adminAutoModel =
  selectedModel === DEFAULT_MODEL_ID
    ? (content.length > 600 ? VERY_HARD_MODEL_ID : content.length > 350 ? HARD_MODEL_ID : DEFAULT_MODEL_ID)
    : selectedModel;

const hasUserKey = !!userKey?.trim();

//  userKey থাকলেই Gemini/DeepSeek auto switch (only on DEFAULT auto mode)
const autoModel =
  hasUserKey && selectedModel === DEFAULT_MODEL_ID
    ? pickAutoModelId(content)
    : adminAutoModel;

const isDeepseekThinking = autoModel === AUTO_THINK_ID;
if (isDeepseekThinking) startThinking();
else stopThinking();

const response = await getGeminiResponse({
  prompt: content,
  history: apiHistory,
  modelId: autoModel,
  systemInstruction: systemPrompt,
});
      
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
        content: !navigator.onLine ? "No internet connection. Please check your internet connection." : `Error: ${((error as any)?.message || "Groq API Error")}`,
        timestamp: Date.now()
      };
      updateConversation([...updatedMessages, errorMessage]);
    } finally {
  stopThinking();
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
      const hasUserKey = !!getUserApiKey()?.trim();

const regenModelId =
  hasUserKey && selectedModel === DEFAULT_MODEL_ID
    ? pickAutoModelId(lastUserPrompt)
    : (selectedModel === DEFAULT_MODEL_ID
        ? (lastUserPrompt.length > 600 ? VERY_HARD_MODEL_ID : lastUserPrompt.length > 350 ? HARD_MODEL_ID : DEFAULT_MODEL_ID)
        : selectedModel);
      const isDeepseekThinking = regenModelId === AUTO_THINK_ID;
if (isDeepseekThinking) startThinking();
else stopThinking();
      const tool = TOOL_CATEGORIES.find(t => t.id === conversation?.category);
const systemPrompt = tool ? tool.prompt : "";

const response = await getGeminiResponse({
  prompt: lastUserPrompt,
  history: previousMessages.slice(-12),
  modelId: regenModelId,
  systemInstruction: systemPrompt,
});
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F3F0FF]">
      <Header 
        toggleSidebar={toggleSidebar} 
        selectedModel={selectedModel} 
        setSelectedModel={setSelectedModel} 
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-10 pb-24 flex flex-col">
        {(!conversation || conversation.messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center px-6 text-center py-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl">
              A
            </div>
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">Welcome to ASK-GPT</h1>
              <p className="mt-2 text-[17px] text-gray-500 font-medium">
                How can I assist you today?
              </p><p className="mt-3 text-[14px] text-gray-500 font-medium">👑 Developer: Prohor (Boss)</p>
            </div>
          <div className="hidden">
                
            
              <button onClick={() => handleSend("Write a professional email for a job application.")} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 text-sm text-left transition-all">
                "Write a professional email for a job application."
              </button>
              <button onClick={() => handleSend("Translate 'Hello, how are you?' to Bangla.")} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 text-sm text-left transition-all">
                "Translate 'Hello, how are you?' to Bangla."
              </button>
              <button onClick={() => handleSend("Write a Python script to scrape a website.")} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 text-sm text-left transition-all">
                "Write a Python script to scrape a website."
              </button>
            </div>
          </div>
        ) : (
          <div>
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
                   {isThinking && (
  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
    <button
      type="button"
      onClick={() => setThinkingOpen(v => !v)}
      className="flex items-center gap-2"
    >
      <span>Thinking</span>
      <span>{thinkingOpen ? "›" : "▾"}</span>
    </button>

    <button
      type="button"
      onClick={() => setThinkingOpen(false)}
      className="underline"
    >
      Skip
    </button>
  </div>
)}

{isThinking && thinkingOpen && (
  <div className="mb-3 text-sm text-gray-600">
    {thinkingText}
  </div>
)}
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
