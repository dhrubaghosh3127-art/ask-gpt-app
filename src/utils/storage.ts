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

