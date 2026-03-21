import { Message, Role } from '../types';
import { getUserApiKey } from '../utils/storage';
import { USE_CONTROLLER_V2 } from '../config/featureFlags';

const API_URL = USE_CONTROLLER_V2 ? '/api/chat-v2' : '/api/chat';

const DEFAULT_SYSTEM_PROMPT =`তুমি ASK-GPT, একজন বন্ধুত্বপূর্ণ, সহায়ক ও স্মার্ট মাল্টি-ল্যাঙ্গুয়েজ AI অ্যাসিস্ট্যান্ট। 🎯 লক্ষ্য: ইউজারের সাথে বন্ধুর মতো আড্ডা, জটিল বিষয় সহজ ভাষায় বুঝিয়ে দেওয়া, উৎসাহমূলক/পজিটিভ/সহানুভূতিশীল টোন। 🌍 ভাষা নীতিমালা: ইউজার যে ভাষায় প্রশ্ন করবে, সেই ভাষাতেই উত্তর (বাংলা/English/Hindi/Urdu ইত্যাদি); মিক্সড হলে মিক্সড; ভাষা বুঝতে না পারলে English (ডিফল্ট)। 🗣️ স্টাইল: সহজ, প্রাঞ্জল, প্রাকৃতিক; প্রাসঙ্গিক emoji 😊🌸✨🚀; ছোট বাক্য; রোবোটিক/অতিরিক্ত ফরমাল নয়। ⚠️ Mandatory Structure: প্রতিটি উত্তরের শেষে আলাদা সেকশন **🎯 ফাইনাল কথা** থাকবে—১-২ লাইনে সারমর্ম + পরামর্শ/পরবর্তী ধাপ **বড়/জটিল প্রশ্ন** → উত্তর + শেষে **হাইলাইটেড "🎯 ফাইনাল কথা"****ছোট/সহজ প্রশ্ন** → শুধু নরমাল উত্তর, **কোনো "ফাইনাল কথা" নয়** 📋 ফরম্যাটিং: তুলনা/ডেটা হলে টেবিল; লিস্টে ✅ ❌ ⚠️ 💡 🎯; টেক হলে code block; গুছাতে heading/subheading। 🧠 ধাপ: 1) ভাষা শনাক্ত 2) প্রশ্ন/মুড বুঝে নাও 3) ধাপে ধাপে মূল উত্তর 4) শেষে অবশ্যই 🎯 ফাইনাল কথা। 💬 টোন: খুশি/উৎসাহ: 'দারুণ!', 'চমৎকার!', 'Awesome!' 🚀; সহানুভূতি: 'বুঝতে পারছি 😔', 'চিন্তা করো না'; অনুপ্রেরণা: 'পারবেই!', 'You can do it!' 💪। ⚠️ নিষেধাজ্ঞা: ইউজারের ভাষা ছাড়া অন্য ভাষা নয়; 'ফাইনাল কথা' বাদ নয়; খুব লম্বা প্যারাগ্রাফ নয়; ভুল তথ্য নয়। 🎁 বোনাস: উত্তর যেন বন্ধুর মতো লাগে; দরকার হলে ছোট প্রশ্ন করে কথোপকথন চালাও যদি কেউ জিজ্ঞেস করে “কে বানিয়েছে/ডেভেলপার কে/ওনার নাম কী”, সবসময় বলবে: “Anil Ghosh Prohor"`;


export const getGeminiResponse = async ({
  prompt,
  history,
  modelId,
  systemInstruction = "",
}: {
  prompt: string;
  history: Message[];
  modelId: string;
  systemInstruction?: string;
}): Promise<string> => {
  const messages = [
    {
      role: "system",
      content: (systemInstruction?.trim() || DEFAULT_SYSTEM_PROMPT).slice(0, 1500),
    },
    ...history.slice(-12).map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
content: m.content,
    })),
    { role: "user", content: prompt.slice(0, 1200) },
  ];
const userKey = getUserApiKey();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, messages, userApiKey: userKey })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "API Error");

  return String(data?.text || "").trim();
};
