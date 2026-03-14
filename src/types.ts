export enum Role {
  USER = 'user',
  MODEL = 'model'
}
export type ImageAttachment = { dataUrl: string; mimeType: string };
export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: ImageAttachment[];
  timestamp: number;
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastUpdated: number
  category?: string
  archived?: boolean
pinned?: boolean
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  prompt: string;
}
export interface AppUser {
  uid: string;
  name: string;
  email: string;
  age: string;
  provider: 'google' | 'email' | 'guest';
  createdAt: number;
}

export interface AuthState {
  isGuest: boolean;
  isLoggedIn: boolean;
  hasSeenAuthScreen: boolean;
  user: AppUser | null;
}
