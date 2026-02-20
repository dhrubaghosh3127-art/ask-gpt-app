import React { useState, useEffect useRef } from react
import { useParams, useNavigate } from 'react-router-dom
import { ChevronRight } from lucide-react
import Header from /components/Header
import ChatInput from /components/ChatInput
import ChatMessage from /components/ChatMessage
import { Conversation, Message, Role } from /types
import { getConversations, saveConversations } from '../utils/storage
import { getGeminiResponse } from '../services/geminiService
import { MODELS } from /constants

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
        navigate('/');
      }
    } else {
      setConversation(null);
    }
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const updateConversation = (newMessages: Message[]) => {
    const conversations = getConversations();
    const currentId = id || Date.now().toString();
    
    const updatedConv: Conversation = conversation 
      ? { ...conversation, messages: newMessages, lastUpdated: Date.now() }
      : { 
          id: currentId, 
          title: newMessages[0].content.slice(0, 30) + (newMessages[0].content.length > 30
          messages: newMessages, 
          lastUpdated: Date.now() 
        };

    const updatedList = conversations.filter(c => c.id !== currentId);
    saveConversations([updatedConv, ...updatedList]);
    setConversation(updatedConv);
    if (!id) navigate(`/${currentId}`);
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
      const response = await getGeminiResponse(content, updatedMessages, selectedModel);
      
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
        content: "Error: Could not connect to Gemini API. Please check your network or API key configuration
        timestamp: Date.now()
      };
      updateConversation([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
      <Header 
        toggleSidebar={toggleSidebar} 
        selectedModel={selectedModel} 
        setSelectedModel={setSelectedModel} 
      />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto py-12 flex flex-col items-center">
          {/* Permanent Welcome Section */}
          <div className="text-center mb-10 px-6">
            <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
              Welcome to ASK-GPT
            </h1>
            <p className="text-[17px] text-gray-500 font-medium mb-6">
              How can I assist you today?
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-full shadow-sm">
              <span className="text-sm">ðŸ‘‘</span>
              <span className="text-[13px] font-semibold text-gray-600">Developer: Prohor (Boss)</span>
            </div>
          </div>

          {/* Messages List */}
          <div className="w-full">
            {conversation?.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
              <div className="flex flex-col items-start w-full mb-6 px-4">
                <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {/* Footer Badge */}
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <button className="w-full flex items-center justify-between px-5 py-3.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm hover:bg-white/60 transition-all group">
            <div className="flex items-center gap-3">
              <span className="text-lg">ðŸ‘‘</span>
              <span className="text-[14px] font-bold text-gray-700">Developer: Prohor (Boss)</span>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage
