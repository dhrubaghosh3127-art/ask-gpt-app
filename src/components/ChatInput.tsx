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
const formClassName = 'relative mx-auto w-full max-w-[760px] rounded-[30px] border border-[#e8ebf0] bg-white px-5 pt-4 pb-3 shadow-[0_10px_26px_rgba(15,23,42,0.07)]'
  const [mode, setMode] = useState<'Auto' | 'Fast' | 'Thinking'>('Auto');
  const [modeOpen, setModeOpen] = useState(false);
  const [webActive, setWebActive] = useState(false);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = input.trim() ? `${Math.min(textareaRef.current.scrollHeight, 64)}px` : '38px';
    }
  }, [input]);
const textareaClassName = 'min-h-[38px] flex-1 resize-none bg-transparent border-none p-0 text-[16px] leading-6 text-[#111827] placeholder:text-[#b8bec7] focus:ring-0 focus:outline-none'
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
       <div className="relative">
  <div className="flex items-start gap-3">
    <textarea
      ref={textareaRef}
      rows={1}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ask anything..."
      className={textareaClassName}
    />

    <div className="mt-1 flex shrink-0 items-center gap-3">
      <button
        type="button"
        aria-label="Voice"
        className="h-12 w-12 rounded-full bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] border border-[#eceff3] flex items-center justify-center text-black"
        onClick={() => {}}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m-4 0h8" />
        </svg>
      </button>

      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className={`h-14 w-14 rounded-[20px] flex items-center justify-center shadow-[0_12px_30px_rgba(37,99,235,0.26)] transition-all active:scale-95 ${
          input.trim() && !isLoading
            ? 'bg-[#1677ff] text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        {isLoading ? (
          <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 4l8 8-8 8" />
          </svg>
        )}
      </button>
    </div>
  </div>

  <div className="mt-3 flex items-center gap-2 whitespace-nowrap origin-left scale-[0.92]">
  <button
  type="button"
  onClick={() => setAttachOpen(v => !v)}
  aria-label="Attach"
  className="shrink-0 inline-flex h-[30px] min-w-[82px] items-center gap-[6px] rounded-[15px] border border-[#e7eaf0] bg-white px-[11px] text-[13px] font-medium text-[#111827] shadow-none"
>
  <svg className="h-[14px] w-[14px] text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.19 9.19a2 2 0 01-2.83-2.83l8.49-8.49" />
      </svg>
      <span>Upload</span>
    </button>

   <button
  type="button"
  onClick={() => setWebActive(v => !v)}
  className={`shrink-0 inline-flex h-[30px] min-w-[82px] items-center gap-[6px] rounded-[15px] px-[11px] text-[13px] font-medium shadow-none ${
    webActive
      ? 'border border-[#dbe7ff] bg-[#edf4ff] text-[#2563eb]'
      : 'border border-[#e7eaf0] bg-white text-[#111827]'
  }`}
>
      <svg className="h-[14px] w-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-3.51-7.11" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18M12 3a15.3 15.3 0 000 18" />
      </svg>
      <span>Web</span>
    </button>

    <button
  type="button"
  onClick={() => setModeOpen(v => !v)}
 className="shrink-0 inline-flex h-[30px]  items-center gap-[4px] rounded-[15px] border border-[#e7eaf0] bg-white pl-[11px] pr-[6px] text-[13px] font-medium text-[#111827] shadow-none"
>
  <span>{mode === 'Thinking' ? 'Think' : mode}</span>
  <span className="text-[9px] text-[#6b7280]">▾</span>
</button>

    <button
  type="button"
  className="shrink-0 inline-flex h-[30px]  items-center gap-[6px] rounded-[15px] border border-[#e7eaf0] bg-white pl-[11px] pr-[7px] text-[13px] font-medium text-[#111827] shadow-none"
>
  <span>Model</span>
  <span className="text-[10px] text-[#6b7280]">▾</span>
</button>
  </div>

  {modeOpen && (
    <div className="absolute left-0 bottom-[58px] z-20 w-44 overflow-hidden rounded-2xl border border-[#e7ebf0] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
      <button
        type="button"
        onClick={() => { setMode('Auto'); setModeOpen(false); }}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        Auto
      </button>
      <button
        type="button"
        onClick={() => { setMode('Fast'); setModeOpen(false); }}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        Fast
      </button>
      <button
        type="button"
        onClick={() => { setMode('Thinking'); setModeOpen(false); }}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        Thinking
      </button>
    </div>
  )}

  {attachOpen && (
    <div className="absolute left-0 bottom-[58px] z-20 w-44 overflow-hidden rounded-2xl border border-[#e7ebf0] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
      <button
        type="button"
        onClick={openUpload}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        Gallery
      </button>
      <button
        type="button"
        onClick={openCamera}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        Camera
      </button>
    </div>
  )}

  <input
    ref={uploadRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => setAttachedImage(e.target.files?.[0] ?? null)}
  />
  <input
    ref={cameraRef}
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={(e) => setAttachedImage(e.target.files?.[0] ?? null)}
  />
</div> 
      </form>
      <p className="max-w-3xl mx-auto text-center mt-3 text-[10px] text-gray-500 dark:text-gray-400">
        ASK-GPT can make mistakes. Verify important information. Free Tier v1.
      </p>
    </div>
  );
};

export default ChatInput;
