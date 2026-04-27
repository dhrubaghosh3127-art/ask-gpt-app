import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string, images?: File[]) => void;
  isLoading: boolean;
  onTranscribe?: (audioBase64: string, mimeType: string, language?: string) => Promise<string>;
  onImageAnalyze?: (imageBase64: string, mimeType: string) => Promise<string>;
  isTranscribing?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, onTranscribe, onImageAnalyze, isTranscribing = false }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
const uploadRef = useRef<HTMLInputElement>(null);
const cameraRef = useRef<HTMLInputElement>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const streamRef = useRef<MediaStream | null>(null);
const [isRecording, setIsRecording] = useState(false);

const stopStreamTracks = () => {
  streamRef.current?.getTracks().forEach(track => track.stop());
  streamRef.current = null;
};
const openUpload = () => { setAttachOpen(false); uploadRef.current?.click(); };
const openCamera = () => { setAttachOpen(false); cameraRef.current?.click(); };
const formClassName = 'relative mx-auto w-full max-w-[760px] rounded-[30px] border border-[#e8ebf0] bg-white px-5 pt-4 pb-3 shadow-[0_10px_26px_rgba(15,23,42,0.07)]'
  const [mode, setMode] = useState<'Auto' | 'Fast' | 'Thinking'>('Auto');
  const [modeOpen, setModeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
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

  if ((!input.trim() && attachedImages.length === 0) || isLoading) {
    return;
  }

  onSend(input.trim(), attachedImages);
  setInput('');
  setAttachedImages([]);
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const handleVoiceClick = async () => {
  if (isLoading || isTranscribing) return;

  if (isRecording) {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    return;
  }

  if (!onTranscribe) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    audioChunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        const audioBase64 = await blobToBase64(audioBlob);
        const text = await onTranscribe(
          audioBase64,
          audioBlob.type || 'audio/webm'
        );

        if (text?.trim()) {
          setInput((prev) => (prev.trim() ? `${prev} ${text.trim()}` : text.trim()));
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Voice transcription failed');
      } finally {
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        stopStreamTracks();
        setIsRecording(false);
      }
    };

    recorder.start();
    setIsRecording(true);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Microphone access denied');
    stopStreamTracks();
    setIsRecording(false);
  }
};
const handleImageFile = async (file: File | null) => {
  if (!file) return;

  setAttachedImages((prev) => [...prev, file]);

  if (uploadRef.current) uploadRef.current.value = "";
  if (cameraRef.current) cameraRef.current.value = "";
};
  return (
    <div className="w-full px-4 pb-4">
      <form 
        onSubmit={handleSubmit}
        className={formClassName}
      >
       <div className="relative">
         {attachedImages.length > 0 && (
  <div className="mb-3 flex gap-2 overflow-x-auto">
    {attachedImages.map((file, idx) => (
      <div
        key={`${file.name}-${idx}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eceff3] bg-[#f8f8f8]"
      >
        <img
          src={URL.createObjectURL(file)}
          alt={`attachment-${idx + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
    ))}
  </div>
)}
  <div className="flex items-start gap-3">
    {isRecording ? (
  <div className={`${textareaClassName} flex items-center gap-3 select-none`}>
    <div className="flex items-end gap-[3px] h-6">
      <span className="w-[3px] h-[8px] rounded-full bg-black/80 animate-bounce"></span>
      <span className="w-[3px] h-[16px] rounded-full bg-black/80 animate-bounce [animation-delay:0.12s]"></span>
      <span className="w-[3px] h-[11px] rounded-full bg-black/80 animate-bounce [animation-delay:0.24s]"></span>
      <span className="w-[3px] h-[18px] rounded-full bg-black/80 animate-bounce [animation-delay:0.36s]"></span>
      <span className="w-[3px] h-[9px] rounded-full bg-black/80 animate-bounce [animation-delay:0.48s]"></span>
    </div>
    <span className="text-[16px] text-[#6b7280]">Listening...</span>
  </div>
) : (
<textarea
  ref={textareaRef}
  rows={1}
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Ask anything..."
  className={textareaClassName}
  style={{ caretColor: 'var(--accent-caret)' }}
/>
)}

    <div className="mt-1 flex shrink-0 items-center gap-3">
      <button
  type="button"
  aria-label={isRecording ? "Stop recording" : isTranscribing ? "Transcribing" : "Voice"}
  className={`shrink-0 h-11 w-11 rounded-full border border-[#eceff3] bg-white flex items-center justify-center shadow-[0_8px_20px_rgba(17,17,17,0.08)] transition-all ${isRecording ? 'ring-2 ring-red-400' : ''} ${isTranscribing ? 'opacity-60' : ''}`}
  onClick={handleVoiceClick}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M19 11v1a7 7 0 01-14 0v-1" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 19v2m-4 0h8" />
  </svg>
</button>
{!input.trim() && !isLoading && !isRecording && !isTranscribing ? (
  <button
  type="button"
  aria-label="Speak"
  className="h-11 px-[14px] rounded-full bg-[#111111] text-white flex items-center justify-center gap-[7px] shadow-[0_8px_20px_rgba(17,17,17,0.14)] transition-all"
  style={{ backgroundColor: 'var(--accent-send-button)' }}
>
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 9v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 6v12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 8v8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M18 5v14" />
    </svg>
    <span className="text-[14px] font-semibold leading-none">Speak</span>
  </button>
) : (
  <button
  type={isLoading || isRecording || isTranscribing ? 'button' : 'submit'}
  onClick={isRecording ? handleVoiceClick : undefined}
  className={`h-11 w-11 flex items-center justify-center transition-all ${
    isLoading
      ? 'rounded-full bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.14)]'
      : 'rounded-[16px] bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.14)]'
  }`}
  style={{ backgroundColor: 'var(--accent-send-button)' }}
>
    {isLoading ? (
      <div className="h-[10px] w-[10px] rounded-[3px] bg-white" />
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19V5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 11l6-6 6 6" />
      </svg>
    )}
  </button>
)}
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
  onClick={() => setModelOpen(true)}
  className="shrink-0 inline-flex h-[30px] items-center gap-[6px] rounded-[15px] border border-[#e7eaf0] bg-white pl-[11px] pr-[10px] text-[13px]"
>
  <span>Model</span>
  <span className="text-[10px] text-[#6b7280]">⌄</span>
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
{modelOpen && (
  <div className="fixed inset-0 z-50">
    <div
      className="absolute inset-0 bg-black/35"
      onClick={closeModelSheet}
    />

    <div
      className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[520px] overflow-hidden rounded-t-[32px] bg-[#fbfcf8] px-5 pt-3 pb-5 shadow-[0_-18px_50px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out"
      style={{
        height: '88vh',
        transform: `translateY(${modelSheetY}px)`,
      }}
      onTouchStart={handleModelSheetTouchStart}
      onTouchMove={handleModelSheetTouchMove}
      onTouchEnd={handleModelSheetTouchEnd}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex justify-center">
        <div className="h-[6px] w-[64px] rounded-full bg-[#cfcfc8]" />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[24px] font-bold tracking-[-0.03em] text-[#143238]">
          Models
        </h3>

        <button
          type="button"
          onClick={closeModelSheet}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#eef0ec] text-[30px] leading-none text-[#143238]"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="h-px w-full bg-[#deded8]" />

      <div>
        {[
          {
            name: 'Llama 3.3 70B',
            desc: 'Fast and balanced for everyday chat, writing, and general tasks.',
            logo: 'meta',
            locked: false,
          },
          {
            name: 'GPT-OSS 120B',
            desc: 'Hard reasoning, math solving, coding, and deep problem analysis.',
            logo: 'openai',
            locked: false,
          },
          {
            name: 'GPT-OSS 20B',
            desc: 'Quick reasoning and lightweight problem solving.',
            logo: 'openai',
            locked: false,
          },
          {
            name: 'Qwen 3-32B',
            desc: 'Strong multilingual model for Bangla, English, writing, and coding.',
            logo: 'qwen',
            locked: false,
          },
          {
            name: 'GPT-5.5',
            desc: 'Advanced reasoning and high-quality responses for complex tasks.',
            logo: 'openai',
            locked: true,
          },
          {
            name: 'Gemini 3.1 Pro',
            desc: 'Strong for multimodal understanding, long-context tasks, and smart analysis.',
            logo: 'gemini',
            locked: true,
          },
          {
            name: 'Claude Sonnet 4.6',
            desc: 'Excellent for writing, analysis, and clear natural responses.',
            logo: 'claude',
            locked: true,
          },
          {
            name: 'Claude Opus 4.7',
            desc: 'Top-tier deep reasoning, creative writing, and high-level problem solving.',
            logo: 'claude',
            locked: true,
          },
        ].map((model) => (
          <div
            key={model.name}
            className={`flex h-[66px] w-full items-center gap-4 border-b border-[#e6e6e1] ${
              model.locked ? 'opacity-55' : ''
            }`}
          >
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center">
              {model.logo === 'meta' && (
                <svg
                  className="h-[32px] w-[32px]"
                  viewBox="0 0 64 40"
                  fill="none"
                >
                  <path
                    d="M8 28C8 16 14 7 22 7C28 7 32 15 36 21C40 27 43 33 49 33C55 33 59 27 59 20C59 13 55 7 49 7C42 7 38 15 32 24C26 33 21 33 17 33C11 33 8 31 8 28Z"
                    stroke="#1684ff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {model.logo === 'openai' && (
                <svg
                  className="h-[31px] w-[31px] text-[#111111]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.85"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3.1c2 0 3.7 1.3 4.2 3.1 1.8.4 3.2 2 3.2 3.9 0 1.3-.6 2.5-1.5 3.2.2 1.8-.7 3.5-2.3 4.4-1.1.7-2.5.7-3.6.2-1.3 1.3-3.3 1.5-4.9.6-1.1-.6-1.9-1.7-2.1-2.9-1.7-.6-2.9-2.1-2.9-4 0-1.3.6-2.5 1.6-3.3-.1-1.8.8-3.4 2.4-4.3 1.1-.6 2.4-.7 3.5-.2.7-.5 1.5-.7 2.4-.7Z" />
                  <path d="M8.2 6.6 15.8 11v6.3" />
                  <path d="M15.8 6.7 8.2 11v6.2" />
                  <path d="M5.1 10.3 12 14.3l6.9-4" />
                </svg>
              )}

              {model.logo === 'qwen' && (
                <svg
                  className="h-[33px] w-[33px]"
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <path d="M20 3L31 9V21L20 27L9 21V9L20 3Z" fill="#6d5cff" />
                  <path d="M20 13L31 19V31L20 37L9 31V19L20 13Z" fill="#4f46e5" opacity="0.78" />
                  <path d="M20 3V13M9 9L20 15L31 9M9 21L20 27L31 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}

              {model.logo === 'gemini' && (
                <svg
                  className="h-[33px] w-[33px]"
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <path
                    d="M20 2C22.5 11.2 28.8 17.5 38 20C28.8 22.5 22.5 28.8 20 38C17.5 28.8 11.2 22.5 2 20C11.2 17.5 17.5 11.2 20 2Z"
                    fill="#6aa5ff"
                  />
                  <path
                    d="M20 2C22.5 11.2 28.8 17.5 38 20C28.8 22.5 22.5 28.8 20 38C17.5 28.8 11.2 22.5 2 20C11.2 17.5 17.5 11.2 20 2Z"
                    fill="url(#geminiGradient)"
                    opacity="0.9"
                  />
                  <defs>
                    <linearGradient id="geminiGradient" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34A853" />
                      <stop offset="0.45" stopColor="#4285F4" />
                      <stop offset="1" stopColor="#EA4335" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              {model.logo === 'claude' && (
                <svg
                  className="h-[34px] w-[34px]"
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <g stroke="#d97745" strokeWidth="3.2" strokeLinecap="round">
                    <path d="M20 4V36" />
                    <path d="M4 20H36" />
                    <path d="M8.7 8.7L31.3 31.3" />
                    <path d="M31.3 8.7L8.7 31.3" />
                    <path d="M13 5.6L27 34.4" />
                    <path d="M27 5.6L13 34.4" />
                    <path d="M5.6 13L34.4 27" />
                    <path d="M34.4 13L5.6 27" />
                  </g>
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-[19px] tracking-[-0.02em] text-[#111111]">
                {model.name}
              </div>

              <div className="mt-[2px] text-[12px] leading-[16px] text-[#6b7280]">
                {model.desc}
              </div>
            </div>

            {model.locked ? (
              <svg
                className="h-[24px] w-[24px] shrink-0 text-[#8f9698]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            ) : (
              <div className="h-[24px] w-[24px] shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
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
    onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
  />
  <input
    ref={cameraRef}
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
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
