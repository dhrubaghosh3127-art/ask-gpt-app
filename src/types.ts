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

