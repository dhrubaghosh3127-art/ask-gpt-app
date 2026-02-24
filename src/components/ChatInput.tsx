import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
const uploadRef = useRef<HTMLInputElement>(null);
const cameraRef = useRef<HTMLInputElement>(null);

const openUpload = () => { setAttachOpen(false); uploadRef.current?.click(); };
const openCamera = () => { setAttachOpen(false); cameraRef.current?.click(); };
const formClassName = "relative max-w-3xl mx-auto flex items-center gap-3 bg-white/70 dark:bg-gray-900/60 backdrop-blur rounded-2xl shadow-lg border border-gray-200/70 dark:border-gray-700/60 px-3 py-2";
  const [mode, setMode] = useState<'Auto' | 'Fast' | 'Thinking'>('Auto');
  const [modeOpen, setModeOpen] = useState(false);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
const textareaClassName = "flex-1 bg-transparent border-none focus:ring-0 text-[16px] leading-6 text-gray-900 dark:text-white placeholder:text-gray-400 px-2 py-2 resize-none max-h-[120px]";
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full px-4 pb-4">
      <form 
        onSubmit={handleSubmit}
        className={formClassName}
      >
        <div className="relative flex items-center gap-3">
  <button
  type="button"
  onClick={() => setAttachOpen(v => !v)}
  aria-label="Attach"
  className="mr-2 h-12 w-12 shrink-0 rounded-full bg-white/80 dark:bg-gray-800/70 shadow-md border border-gray-200/70 dark:border-gray-700/60 text-gray-700 dark:text-gray-200 flex items-center justify-center active:scale-95"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.19 9.19a2 2 0 01-2.83-2.83l8.49-8.49" />
  </svg>
</button>

  <button
  type="button"
  onClick={() => setModeOpen(v => !v)}
  className="h-12 px-4 rounded-full bg-white/80 dark:bg-gray-800/70 shadow-md border border-gray-200/70 dark:border-gray-700/60 flex items-center gap-2"
>
  <span>🚀</span>
  <span className="font-semibold">{mode}</span>
  <span className="opacity-60">▾</span>
</button>

{modeOpen && (
  <div className="absolute bottom-14 left-14 w-44 overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/70 dark:border-gray-700/60 shadow-xl">
    <button
      type="button"
      onClick={() => { setMode('Auto'); setModeOpen(false); }}
      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
    >
      🚀 Auto
    </button>
    <button
      type="button"
      onClick={() => { setMode('Fast'); setModeOpen(false); }}
      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
    >
      ⚡ Fast
    </button>
    <button
      type="button"
      onClick={() => { setMode('Thinking'); setModeOpen(false); }}
      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
    >
      🧠 Thinking
    </button>
  </div>
)}

{attachOpen && (
    <div className="absolute bottom-14 left-0 w-52 overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-700/70 shadow-xl backdrop-blur-xl">
      <button type="button" onClick={openUpload} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100/70 dark:hover:bg-gray-800/60">📁 Upload photo</button>
      <button type="button" onClick={openCamera} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100/70 dark:hover:bg-gray-800/60">📷 Camera</button>
    </div>
  )}
</div>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className={textareaClassName}
        />
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e)=>setAttachedImage(e.target.files?.[0]||null)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e)=>setAttachedImage(e.target.files?.[0] ?? null)} />
        <button 
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`
            w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95
            ${input.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
          `}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </form>
      <p className="max-w-3xl mx-auto text-center mt-3 text-[10px] text-gray-500 dark:text-gray-400">
        ASK-GPT can make mistakes. Verify important information. Free Tier v1.
      </p>
    </div>
  );
};

export default ChatInput;
