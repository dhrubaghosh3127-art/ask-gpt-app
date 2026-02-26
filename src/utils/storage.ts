import { Conversation } from '../types';

const STORAGE_KEY = 'ask_gpt_conversations';

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

export const getConversations = (): Conversation[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteConversation = (id: string) => {
  const conversations = getConversations();
  const updated = conversations.filter(c => c.id !== id);
  saveConversations(updated);
};
// ===== User API Key (localStorage) =====
const USER_KEY_STORAGE = "ASKGPT_USER_API_KEY";

export const getUserApiKey = () => {
  return localStorage.getItem(USER_KEY_STORAGE) || "";
};

export const setUserApiKey = (key: string) => {
  localStorage.setItem(USER_KEY_STORAGE, key.trim());
};

export const clearUserApiKey = () => {
  localStorage.removeItem(USER_KEY_STORAGE);
};
// ===== Free daily limit (localStorage) =====
const FREE_LIMIT_KEY_PREFIX = "ASKGPT_FREE_COUNT_";

// Local date (device time) -> YYYY-MM-DD
const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getFreeCount = () => {
  const k = FREE_LIMIT_KEY_PREFIX + todayKey();
  const v = localStorage.getItem(k);
  return v ? Number(v) || 0 : 0;
};

export const incFreeCount = () => {
  const k = FREE_LIMIT_KEY_PREFIX + todayKey();
  const next = getFreeCount() + 1;
  localStorage.setItem(k, String(next));
  return next;
};

export const resetFreeCountToday = () => {
  const k = FREE_LIMIT_KEY_PREFIX + todayKey();
  localStorage.removeItem(k);
};
