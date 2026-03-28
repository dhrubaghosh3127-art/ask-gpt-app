import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import { Conversation, Message, Role } from '../types';
import { getConversations, saveConversations, getUserApiKey, getFreeCount, incFreeCount } from '../utils/storage';
import { getGeminiResponse } from '../services/geminiService';
import { generateImage } from '../services/imageService';
import {
  TOOL_CATEGORIES,
  MODELS,
  DEFAULT_MODEL_ID,
  HARD_MODEL_ID,
  VERY_HARD_MODEL_ID,
  IMAGE_FAST_MODEL_ID,
  IMAGE_MODEL_ID,
  IMAGE_ULTRA_MODEL_ID,
} from '../constants';

interface ChatPageProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { id } = useParams();
const navigate = useNavigate();

const [conversation, setConversation] = useState<Conversation | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [isTranscribing, setIsTranscribing] = useState(false);
const [isThinking, setIsThinking] = useState(false);
const [thinkingText, setThinkingText] = useState("");
const [thinkingOpen, setThinkingOpen] = useState(true);
const [thinkingLabel, setThinkingLabel] = useState("Thinking");
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
const makeShortEnglishTitle = (text: string) => {
  const raw = (text || '').trim();
  const t = raw.toLowerCase();

  if (!t) return 'General Chat';

  const hasMathSymbol =
    /[=+\-*/^]/.test(t) ||
    /sin|cos|tan|cot|sec|cosec|log|ln|sqrt|π|theta|integral|derivative|matrix|equation/.test(t);

  const hasMathWords =
    /\b(math|solve|algebra|geometry|trigonometry|theorem|physics|chemistry|biology|calculus)\b/.test(t) ||
    /গণিত|ম্যাথ|সমাধান|সমীকরণ|ত্রিকোণমিতি|পদার্থ|রসায়ন|জীববিজ্ঞান/.test(t);

  if (hasMathSymbol || hasMathWords) return 'Math Help';

  const hasCodeWords =
    /\b(code|coding|python|javascript|typescript|java|c\+\+|cpp|react|html|css|bug|debug|fix|function|api|json|sql|program)\b/.test(t) ||
    /কোড|কোডিং|প্রোগ্রাম|বাগ|ডিবাগ|ফিক্স|ফাংশন|অ্যাপ|ওয়েবসাইট/.test(t);

  if (hasCodeWords) return 'Coding Help';

  const hasImageWords =
    /\b(image|photo|picture|logo|design|ui|ux|icon|draw|edit image|generate image|create image)\b/.test(t) ||
    /ছবি|পিক|ইমেজ|লোগো|ডিজাইন|আইকন|ui|ux/.test(t);

  if (hasImageWords) return 'Image Task';

  const hasTranslateWords =
    /\b(translate|translation|english to bangla|bangla to english|korean to english|japanese to english)\b/.test(t) ||
    /অনুবাদ|ট্রান্সলেট|ইংলিশ|বাংলা|কোরিয়ান|জাপানি/.test(t);

  if (hasTranslateWords) return 'Translation';

  const hasEmailWords =
    /\b(email|mail|application|cv|resume|cover letter|job application)\b/.test(t) ||
    /ইমেইল|মেইল|সিভি|রিজিউম|জব|আবেদন/.test(t);

  if (hasEmailWords) return 'Email Draft';

  const hasWebWords =
    /\b(news|latest|current|today|price|weather|score|match|web|search|verify|official)\b/.test(t) ||
    /খবর|আজকের|দাম|আবহাওয়া|স্কোর|ম্যাচ|সার্চ|ওয়েব|ভেরিফাই/.test(t);

  if (hasWebWords) return 'Web Search';

  const hasWritingWords =
    /\b(write|writing|essay|post|caption|story|article|paragraph)\b/.test(t) ||
    /লিখ|রচনা|ক্যাপশন|পোস্ট|গল্প|আর্টিকেল|প্যারাগ্রাফ/.test(t);

  if (hasWritingWords) return 'Writing Help';

  if (raw.length <= 24) {
    return raw.charAt(0).toUpperCase() + raw.slice(1, 24);
  }

  return 'General Chat';
};
  const updateConversation = (newMessages: Message[]) => {
    
    
    const conversations = getConversations();
    const currentId = id || Date.now().toString();
    
    const firstUserText =
  newMessages.find(m => m.role === Role.USER)?.content || newMessages[0]?.content || '';

const resolvedTitle = makeShortEnglishTitle(firstUserText);

const updatedConv: Conversation = conversation
  ? {
      ...conversation,
      title:
        !conversation.title || conversation.title.trim() === '' || conversation.title === 'New Chat'
          ? resolvedTitle
          : conversation.title,
      messages: newMessages,
      lastUpdated: Date.now()
    }
  : {
      id: currentId,
      title: resolvedTitle,
      messages: newMessages,
      lastUpdated: Date.now()
    };

    const updatedList = conversations.filter(c => c.id !== currentId);
    saveConversations([updatedConv, ...updatedList]);
    setConversation(updatedConv);
    if (!id) navigate(`/chat/${currentId}`);
  };
const isBangla = (text: string) => /[\u0980-\u09FF]/.test(text);
  const AUTO_FLASH_ID = "llama-3.3-70b-versatile";
const AUTO_THINK_ID = "qwen/qwen3-32b";
const AUTO_WEB_ID = "groq/compound";
const ADMIN_DEFAULT_ID = "llama-3.3-70b-versatile";
const ADMIN_THINK_ID = "openai/gpt-oss-120b";
const ADMIN_WEB_ID = "groq/compound";
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
  const shouldAvoidWebSearch = (text: string) => {
  const t = (text || "").toLowerCase();

  const avoidWords =
    /\b(solve|math|equation|integral|derivative|prove|theorem|physics|chemistry|biology|translate|translation|grammar|rewrite|essay|paragraph|summary|explain|what does this mean|coding|code|bug|debug|error in code|typescript|javascript|python|react|html|css|sql|algorithm)\b/i.test(
      t
    );

  const hasMathPattern =
    /[0-9]+\s*[\+\-\*\/=]\s*[0-9]+|x\^|y\^|sqrt|sin|cos|tan|log|ln|∫|Σ|π|theta|>=|<=/.test(
      t
    );

  return avoidWords || hasMathPattern;
};

const shouldUseWebSearch = (text: string) => {
  const t = (text || "").toLowerCase();

  if (shouldAvoidWebSearch(t)) return false;

  const timeWords =
  /\b(latest|today|current|now|right now|recent|recently|update|updated|new|newest|live|real time|ekhon|bortomane|aj|ajke|shorbosesh)\b/i.test(
    t
  );

  const newsWords =
    /\b(news|announcement|release|launched|launch|rollout|breaking|headline)\b/i.test(
      t
    );

  const moneyWords =
  /\b(price|pricing|cost|rate|exchange rate|stock|share price|market cap|crypto|bitcoin|btc|eth|gold price|dollar rate|dollar|usd|tk|taka|koto tk|koto taka|rate koto)\b/i.test(
    t
  );

  const weatherWords =
    /\b(weather|temperature|forecast|rain|storm|humidity)\b/i.test(t);

  const sportsWords =
    /\b(match|score|live score|fixture|schedule|standing|points table|result today)\b/i.test(
      t
    );

  const webIntentWords =
    /\b(search|lookup|look up|find online|check online|verify|fact check|source|official source|official website|website|link|url|visit|browse)\b/i.test(
      t
    );

  const compareCurrentWords =
    /\b(best phone|best laptop|best ai model|which is better now|current version|new version|vs 2026|vs 2025)\b/i.test(
      t
    );

  const hasUrl = /https?:\/\/|www\./i.test(t);

  return (
    timeWords ||
    newsWords ||
    moneyWords ||
    weatherWords ||
    sportsWords ||
    webIntentWords ||
    compareCurrentWords ||
    hasUrl
  );
};
const pickAutoModelId = (text: string) =>
  shouldUseWebSearch(text)
    ? AUTO_WEB_ID
    : shouldUseDeepSeek(text)
      ? AUTO_THINK_ID
      : AUTO_FLASH_ID;
  const shouldCreateImage = (text: string) => {
  const t = (text || "").toLowerCase().trim();

  const imageWords =
    /\b(draw|generate image|create image|make image|make a photo|create a photo|generate a photo|image of|picture of|photo of|poster|wallpaper|thumbnail|logo|icon|banner|avatar|portrait|illustration|sticker|artwork|concept art|character design)\b/i.test(t);

  const banglaImageWords =
    /(ছবি বানাও|ছবি তৈরি|একটা ছবি|ফটো বানাও|ফটো তৈরি|পিকচার বানাও|পোস্টার বানাও|লোগো বানাও|থাম্বনেইল বানাও|ওয়ালপেপার বানাও|ইলাস্ট্রেশন বানাও|পোর্ট্রেট বানাও|ড্র করো|এঁকে দাও)/i.test(t);

  const avoidWords =
    /\b(analyze image|analyse image|describe image|edit image|remove background|extract text|ocr|caption this image)\b/i.test(t);

  return !avoidWords && (imageWords || banglaImageWords);
};

const pickImageModelId = (text: string) => {
  const t = (text || "").toLowerCase().trim();

  const simpleWords =
    /\b(icon|logo|sticker|emoji|simple|minimal|minimalist|flat|cartoon|outline)\b/i.test(t);

  const ultraWords =
    /\b(ultra realistic|photorealistic|realistic|cinematic|4k|8k|highly detailed|detailed face|studio lighting|dramatic lighting|professional photography|product shot|luxury ad|poster with text|typography|text on image)\b/i.test(t);

  const longPrompt = t.length > 220;

  if (ultraWords || longPrompt) return IMAGE_ULTRA_MODEL_ID;
  if (simpleWords && t.length < 90) return IMAGE_FAST_MODEL_ID;
  return IMAGE_MODEL_ID;
};
  const THINKING_LINES = [
  "Understanding the question...",
  "Checking the details...",
  "Working through the steps...",
  "Verifying the result...",
  "Preparing the best answer...",
];
const WEB_SEARCH_LINES = [
  "Searching the web...",
  "Checking trusted sources...",
  "Verifying latest information...",
  "Preparing the answer...",
];
const thinkingTimerRef = useRef<number | null>(null);
const thinkingIndexRef = useRef(0);

const startThinking = (label = "Thinking", lines = THINKING_LINES) => {
  setIsThinking(true);
  setThinkingOpen(true);
  setThinkingLabel(label);

  thinkingIndexRef.current = 0;
  setThinkingText(lines[0]);

  if (thinkingTimerRef.current) window.clearInterval(thinkingTimerRef.current);

  thinkingTimerRef.current = window.setInterval(() => {
    thinkingIndexRef.current =
      (thinkingIndexRef.current + 1) % lines.length;
    setThinkingText(lines[thinkingIndexRef.current]);
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


const handleTranscribe = async (
  audioBase64: string,
  mimeType: string,
  language = "bn"
) => {
  setIsTranscribing(true);

  try {
    const activeUserKey = "";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  mode: 'transcribe',
  audioBase64,
  mimeType,
  language,
  voiceIntelligence: getVoiceIntelligenceMode(),
  advancedTranscribe: getVoiceIntelligenceMode() === 'advanced',
  userKey: activeUserKey,
  userApiKey: activeUserKey,
}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Voice transcription failed");
    }

    return typeof data?.text === "string" ? data.text : "";
  } finally {
    setIsTranscribing(false);
  }
};
  const handleImageAnalysis = async (
  imageBase64: string,
  mimeType: string
) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "vision",
      imageBase64,
      mimeType,
      prompt:
        "Read the image carefully and return only the main text, question, or useful visible content from the image.",
      userKey: "",
      userApiKey: "",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Image analysis failed");
  }

  return typeof data?.text === "string" ? data.text.trim() : "";
};
  const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const handleSend = async (content: string, images: File[] = []) => {
    const attachmentPayload =
  images.length > 0
    ? await Promise.all(
        images.map(async (file) => ({
          dataUrl: await fileToBase64(file),
          mimeType: file.type || "image/jpeg",
        }))
      )
    : [];

const userMessage: Message = {
  id: Date.now().toString(),
  role: Role.USER,
  content,
  attachments: attachmentPayload,
  timestamp: Date.now()
};
const imageContexts =
  images.length > 0
    ? (await Promise.all(
        images.map(async (file) =>
          handleImageAnalysis(
            await fileToBase64(file),
            file.type || "image/jpeg"
          )
        )
      )).filter((text) => text.trim())
    : [];

const effectiveContent = [content.trim(), ...imageContexts]
  .filter((text) => text.trim())
  .join("\n\n");
    const routeContent = images.length > 0 ? effectiveContent : content;
   const updatedMessages = [...(conversation?.messages || []), userMessage];
const apiHistory = updatedMessages.slice(-12);
updateConversation(updatedMessages);

    // Free daily limit (only when userKey NOT set)
const userKey = getUserApiKey();

// ✅ Testing mode: limit off রাখতে true
const DISABLE_FREE_LIMIT = true;

if (!DISABLE_FREE_LIMIT && !userKey) {
  const count = getFreeCount();

  if (count >= 5) {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: Role.MODEL,
      content: limitText(content),
      timestamp: Date.now(),
    };

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
    ? shouldUseWebSearch(content)
      ? ADMIN_WEB_ID
      : shouldUseDeepSeek(content)
      ? ADMIN_THINK_ID
      : ADMIN_DEFAULT_ID
    : selectedModel;

const hasUserKey = !!userKey?.trim();
const isImageRequest = !hasUserKey && shouldCreateImage(content);

if (isImageRequest) {
  stopThinking();

  const imageModelId = pickImageModelId(content);
  const imageResult = await generateImage(content, imageModelId);

  const botMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: Role.MODEL,
    content: `![Generated image](${imageResult.imageUrl})\n\nImage model: ${imageResult.modelId}`,
    timestamp: Date.now(),
  };

  updateConversation([...updatedMessages, botMessage]);
  return;
         }
//  userKey থাকলেই Gemini/DeepSeek auto switch (only on DEFAULT auto mode)
const autoModel =
  hasUserKey && selectedModel === DEFAULT_MODEL_ID
    ? pickAutoModelId(content)
    : adminAutoModel;
const routeModelId =
  images.length > 0 && !hasUserKey && selectedModel === DEFAULT_MODEL_ID
    ? shouldUseWebSearch(routeContent)
      ? ADMIN_WEB_ID
      : shouldUseDeepSeek(routeContent)
      ? ADMIN_THINK_ID
      : ADMIN_DEFAULT_ID
    : autoModel;
const isThinkingModel =
  routeModelId === AUTO_THINK_ID ||
  routeModelId === ADMIN_THINK_ID ||
  routeModelId === ADMIN_WEB_ID;

if (isThinkingModel) {
  if (routeModelId === ADMIN_WEB_ID) {
    startThinking("Searching web", WEB_SEARCH_LINES);
  } else {
    startThinking("Thinking", THINKING_LINES);
  }
} else {
  stopThinking();
}

      const botMessageId = (Date.now() + 1).toString();

const streamingBotMessage: Message = {
  id: botMessageId,
  role: Role.MODEL,
  content: "",
  timestamp: Date.now()
};

updateConversation([...updatedMessages, streamingBotMessage]);

const response = await getGeminiResponse({
  prompt: images.length > 0 ? routeContent : content,
  history: apiHistory,
  modelId: routeModelId,
  systemInstruction: systemPrompt,
  imageBase64: (() => {
    const firstImage: any = images?.[0];
    return typeof firstImage === "string"
      ? firstImage
      : firstImage?.base64 ||
        firstImage?.imageBase64 ||
        firstImage?.dataUrl ||
        firstImage?.url ||
        "";
  })(),
  mimeType: (() => {
    const firstImage: any = images?.[0];
    return firstImage?.mimeType || firstImage?.type || "image/jpeg";
  })(),
  onChunk: (text) => {
    updateConversation([
      ...updatedMessages,
      {
        ...streamingBotMessage,
        content: text,
      },
    ]);
  },
});

updateConversation([
  ...updatedMessages,
  {
    ...streamingBotMessage,
    content: response,
  },
]);
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
    : selectedModel === DEFAULT_MODEL_ID
    ? shouldUseWebSearch(lastUserPrompt)
      ? ADMIN_WEB_ID
      : shouldUseDeepSeek(lastUserPrompt)
      ? ADMIN_THINK_ID
      : ADMIN_DEFAULT_ID
    : selectedModel;
      const isThinkingModel =
  regenModelId === AUTO_THINK_ID ||
  regenModelId === ADMIN_THINK_ID ||
  regenModelId === ADMIN_WEB_ID;

if (isThinkingModel) {
  if (regenModelId === ADMIN_WEB_ID) {
    startThinking("Searching web", WEB_SEARCH_LINES);
  } else {
    startThinking("Thinking", THINKING_LINES);
  }
} else {
  stopThinking();
}
      const tool = TOOL_CATEGORIES.find(t => t.id === conversation?.category);
const systemPrompt = tool ? tool.prompt : "";

const regenBotMessageId = Date.now().toString();

const streamingRegenBotMessage: Message = {
  id: regenBotMessageId,
  role: Role.MODEL,
  content: "",
  timestamp: Date.now()
};

updateConversation([...previousMessages, streamingRegenBotMessage]);

const response = await getGeminiResponse({
  prompt: lastUserPrompt,
  history: previousMessages.slice(-12),
  modelId: regenModelId,
  systemInstruction: systemPrompt,
  imageBase64: (() => {
    const firstImage: any = images?.[0];
    return typeof firstImage === "string"
      ? firstImage
      : firstImage?.base64 ||
        firstImage?.imageBase64 ||
        firstImage?.dataUrl ||
        firstImage?.url ||
        "";
  })(),
  mimeType: (() => {
    const firstImage: any = images?.[0];
    return firstImage?.mimeType || firstImage?.type || "image/jpeg";
  })(),
  onChunk: (text) => {
    updateConversation([
      ...previousMessages,
      {
        ...streamingRegenBotMessage,
        content: text,
      },
    ]);
  },
});

updateConversation([
  ...previousMessages,
  {
    ...streamingRegenBotMessage,
    content: response,
  },
]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden overscroll-none bg-white">
      <Header 
        toggleSidebar={toggleSidebar} 
        selectedModel={selectedModel} 
        setSelectedModel={setSelectedModel} 
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-24 pb-24">
        {(!conversation || conversation.messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center min-h-[52vh] px-6 text-center pb-10">
            <div className="w-full max-w-[340px] mx-auto flex flex-col items-center text-center gap-4">
  <h1 className="w-full max-w-[320px] mx-auto text-center text-[24px] sm:text-[30px] font-bold text-gray-900 tracking-tight leading-none whitespace-nowrap">
    WELCOME TO ASK-GPT 
  </h1>

  <p className="mt-1 text-[17px] text-gray-500 font-medium text-center">
    How can I assist you today?
  </p>

  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#eceff3] bg-white px-4 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
    <span className="text-[15px]">👑</span>
    <span className="text-[14px] text-gray-600 font-medium">Developer: Prohor (Boss)</span>
  </div>
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
              <div className="max-w-3xl mx-auto px-4 py-2">
  <div className="flex items-start gap-3">
  <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center">
  <div className="w-10 h-10 flex items-center justify-center">
    <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
      <defs>
        <clipPath id="mixOrbClip">
          <circle cx="32" cy="32" r="20" />
        </clipPath>

        <filter id="mixSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.6" />
        </filter>

        <radialGradient id="mixWhiteShell" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="84%" stopColor="#eef7ff" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#d8f0ff" stopOpacity="0.94" />
        </radialGradient>

        <radialGradient id="mixBlue" cx="35%" cy="35%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#8be9ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#46a7ff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="mixPink" cx="62%" cy="36%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="32%" stopColor="#ff9de6" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#ff4fc3" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="mixPurple" cx="50%" cy="64%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="34%" stopColor="#c59cff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7c4dff" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="geminiArc" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stopColor="#22c55e" />
  <stop offset="18%" stopColor="#84cc16" />
  <stop offset="38%" stopColor="#facc15" />
  <stop offset="58%" stopColor="#fb923c" />
  <stop offset="78%" stopColor="#ef4444" />
  <stop offset="100%" stopColor="#3b82f6" />
</linearGradient>
      </defs>

      <circle cx="32" cy="32" r="20" fill="url(#mixWhiteShell)" />

      <g clipPath="url(#mixOrbClip)">
        <circle cx="24" cy="25" r="15" fill="url(#mixBlue)" filter="url(#mixSoftBlur)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 32 32"
            to="360 32 32"
            dur="4.8s"
            repeatCount="indefinite"
          />
        </circle>
  <circle cx="41" cy="25" r="14" fill="url(#mixPink)" filter="url(#mixSoftBlur)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 32 32"
            to="0 32 32"
            dur="6.1s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="34" cy="41" r="16" fill="url(#mixPurple)" filter="url(#mixSoftBlur)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 32 32"
            to="360 32 32"
            dur="7.2s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="32" cy="32" r="10" fill="#ffffff" opacity="0.34" />
      </g>

      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="rgba(255,255,255,0.78)"
        strokeWidth="1.2"
      />

      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="2"
      />
<circle
  cx="32"
  cy="32"
  r="26"
  fill="none"
  stroke="url(#geminiArc)"
  strokeWidth="3.5"
  strokeLinecap="round"
  strokeDasharray="42 122"
  strokeDashoffset="0"
  transform="rotate(-150 32 32)"
  opacity="1"
>
  <animateTransform
    attributeName="transform"
    type="rotate"
    from="-150 32 32"
    to="210 32 32"
    dur="0.68s"
    repeatCount="indefinite"
  />
  <animate
    attributeName="stroke-dasharray"
    values="42 122; 22 142; 54 110; 12 152; 34 130; 48 116; 42 122"
    dur="0.96s"
    repeatCount="indefinite"
  />
  <animate
    attributeName="stroke-dashoffset"
    values="0; -16; 10; -22; 6; 0"
    dur="0.88s"
    repeatCount="indefinite"
  />
</circle>
    </svg>
  </div>
</div>
                  <div className="flex-1">
                   {isThinking && (
  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
    <button
      type="button"
      onClick={() => setThinkingOpen(v => !v)}
      className="flex items-center gap-2"
    >
      <span>{thinkingLabel}</span>
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

    
  <ChatInput
  onSend={handleSend}
  isLoading={isLoading}
  onTranscribe={handleTranscribe}
  onImageAnalyze={handleImageAnalysis}
  isTranscribing={isTranscribing}
/>
</div>
  );
};

export default ChatPage;      
