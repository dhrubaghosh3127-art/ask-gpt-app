import React, { useState } from 'react';
import { Message, Role } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
interface ChatMessageProps {
  message: Message;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDelete, onEdit, onRegenerate }) => {
  const isUser = message.role === Role.USER;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    navigator.vibrate?.(20);
  };

  const handleSaveEdit = () => {
    onEdit(message.id, editValue);
    setIsEditing(false);
  };
const MdPre=(p:any)=>{const r=p.children?.props?.children,t=(Array.isArray(r)?r.join(''):String(r??'')).replace(/\n$/,'');return(<div className="relative"><pre className={p.className}>{p.children}</pre><button type="button" onClick={()=>{navigator.clipboard.writeText(t);navigator.vibrate?.(20);}} className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/60 text-white">Copy</button></div>);};
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} px-4 my-3`}>
      <div className={`w-full flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        
          
        
        <div className={`w-full flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-tight">
            {isUser ? 'You' : 'ASK-GPT'}
          </div>
          
          <div className={`${isUser ? 'max-w-[95%] rounded-2xl bg-blue-200 text-gray-900 px-4 py-3 shadow-sm' : 'w-full max-w-none bg-transparent p-0 border-0 shadow-none rounded-none text-gray-900 dark:text-gray-100'}`}>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Cancel</button>
                </div>
              </div>
            ) : (
             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MdPre }} className="markdown">{message.content}</ReactMarkdown>
            )}
          </div>
          
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1">
              📋 Copy
            </button>
            {isUser && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1">
                ✏️ Edit
              </button>
            )}
            {!isUser && onRegenerate && (
              <button onClick={onRegenerate} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1">
                🔄 Regenerate
              </button>
            )}
            <button onClick={() => onDelete(message.id)} className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1">
              🗑️ Delete
            </button>
            <button className="text-gray-400 hover:text-blue-500 text-xs">👍</button>
            <button className="text-gray-400 hover:text-red-500 text-xs">👎</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
                                  
