import React, { useState } from 'react';
import { Link } from "react-router-dom";
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
          
          <div className={`${isUser ? 'w-full max-w-[95%]' : 'w-full max-w-none bg-transparent text-gray-900'}`}>
  {isEditing ? (
    <div className={`flex flex-col gap-2 ${isUser ? 'rounded-2xl bg-blue-200 text-gray-900 px-4 py-3 shadow-sm' : ''}`}>
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
        rows={3}
      />
      <div className="flex gap-2">
        <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
        <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Cancel</button>
      </div>
    </div>
  ) : (
    <>
      {message.attachments?.length ? (
        <div className={`mb-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {message.attachments.map((img, idx) => (
            <img
              key={`${message.id}-img-${idx}`}
              src={img.dataUrl}
              alt={`attachment-${idx + 1}`}
              className="w-[200px] max-w-full rounded-2xl border border-black/5 object-cover"
            />
          ))}
        </div>
      ) : null}

      {message.content ? (
       <div className={`${isUser ? 'ml-auto inline-block max-w-full rounded-2xl bg-blue-200 text-gray-900 px-4 py-3 shadow-sm' : 'w-full'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre: MdPre,
              a: ({ href, children }) => {
                const url = href || "";
                const isInternal = url.startsWith("/") || url.startsWith("#");
                if (isInternal) return <Link to={url} className="underline">{children}</Link>;
                return (
                  <a href={url} target="_blank" rel="noreferrer" className="underline">
                    {children}
                  </a>
                );
              },
            }}
            className="markdown text-[14px] leading-relaxed"
          >
            {message.content}
          </ReactMarkdown>
        </div>
      ) : null}
    </>
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
                                  
