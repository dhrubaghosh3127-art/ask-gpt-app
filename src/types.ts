export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  category?: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  prompt: string;
}

