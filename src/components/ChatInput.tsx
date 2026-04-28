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
  <div className="fixed inset-0 z-50 flex items-end bg-black/35">
    <div
      className="w-full overflow-hidden rounded-t-[32px] bg-[#fbfcf8] px-5 pt-3 pb-5 shadow-[0_-18px_50px_rgba(0,0,0,0.18)]"
      style={{ height: '86vh' }}
    >
      <div className="mb-4 flex justify-center">
        <div className="h-[6px] w-[64px] rounded-full bg-[#cfcfc8]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-[24px] font-bold tracking-[-0.03em] text-[#143238]">
          Models
        </div>

        <button
          type="button"
          onClick={() => setModelOpen(false)}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#eef0ec] text-[30px] leading-none text-[#143238]"
          aria-label="Close models"
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
            logo: '/model-logos/meta.png',
            locked: false,
          },
          {
            name: 'GPT-OSS 120B',
            desc: 'Hard reasoning, math solving, coding, and deep problem analysis.',
            logo: '/model-logos/openai.png',
            locked: false,
          },
          {
            name: 'GPT-OSS 20B',
            desc: 'Quick reasoning and lightweight problem solving.',
            logo: '/model-logos/openai.png',
            locked: false,
          },
          {
            name: 'Qwen 3-32B',
            desc: 'Strong multilingual model for Bangla, English, writing, and coding.',
            logo: '/model-logos/qwen.png',
            locked: false,
          },
          {
            name: 'GPT-5.5',
            desc: 'Advanced reasoning and high-quality responses for complex tasks.',
            logo: '/model-logos/openai.png',
            locked: true,
          },
          {
            name: 'Gemini 3.1 Pro',
            desc: 'Strong for multimodal understanding, long-context tasks, and smart analysis.',
            logo: '/model-logos/gemini.png',
            locked: true,
          },
          {
            name: 'Claude Sonnet 4.6',
            desc: 'Excellent for writing, analysis, and clear natural responses.',
            logo: '/model-logos/claude.png',
            locked: true,
          },
          {
            name: 'Claude Opus 4.7',
            desc: 'Top-tier deep reasoning, creative writing, and high-level problem solving.',
            logo: '/model-logos/claude.png',
            locked: true,
          },
        ].map((model) => (
          <div
            key={model.name}
            className={`flex h-[61px] w-full items-center gap-4 border-b border-[#e6e6e1] ${
              model.locked ? 'opacity-55' : ''
            }`}
          >
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center">
              <img
                src={model.logo}
                alt=""
                className="h-[30px] w-[30px] object-contain"
                draggable={false}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold leading-[19px] tracking-[-0.02em] text-[#111111]">
                {model.name}
              </div>

              <div className="mt-[2px] truncate text-[12px] leading-[16px] text-[#6b7280]">
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
  <div className="fixed inset-0 z-50 flex items-end bg-black/35">
    <div
      className="w-full rounded-t-[32px] bg-[#fbfcf8] px-5 pt-3 pb-5 shadow-[0_-18px_50px_rgba(0,0,0,0.18)]"
      style={{ minHeight: '46vh' }}
    >
      <div className="mb-4 flex justify-center">
        <div className="h-[6px] w-[58px] rounded-full bg-[#d5d7dc]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
          Options
        </div>

        <button
          type="button"
          onClick={() => setAttachOpen(false)}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#f1f3f0] text-[26px] leading-none text-[#111111]"
          aria-label="Close options"
        >
          ×
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <button
          type="button"
      onClick={openCamera}
          
          className="flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-[17px] border border-[#e2e2dd] bg-white text-[#111111]"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4.5 13 3H9L7.5 4.5H5a2 2 0 0 0-2 2v11A2.5 2.5 0 0 0 5.5 20h13A2.5 2.5 0 0 0 21 17.5v-11a2 2 0 0 0-2-2h-4.5Z" />
            <circle cx="12" cy="12.5" r="3.5" />
          </svg>
          <span className="text-[14px] font-medium tracking-[-0.02em]">
            Camera
          </span>
        </button>

        <button
          type="button"
          onClick={openUpload}
          className="flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-[17px] border border-[#e2e2dd] bg-white text-[#111111]"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="1.5" />
            <path d="M20 15.5 16 11.5 10 17.5 7.5 15 4 18.5" />
          </svg>
          <span className="text-[14px] font-medium tracking-[-0.02em]">
            Photos
          </span>
        </button>

        <button
          type="button"
          onClick={() => alert('File upload will be available soon.')}
          className="flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-[17px] border border-[#e2e2dd] bg-white text-[#111111]"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
          </svg>
          <span className="text-[14px] font-medium tracking-[-0.02em]">
            Files
          </span>
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white">
        <div className="relative">
  <button
    type="button"
    onClick={() => setModeOpen((v) => !v)}
    className="flex h-[58px] w-full items-center justify-between px-4 text-left"
  >
    <div className="flex items-center gap-3">
      <svg
        className="h-6 w-6 text-[#111111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2 15 8.5 22 12 15 15.5 12 22 9 15.5 2 12 9 8.5 12 2Z" />
      </svg>

      <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
        Thinking
      </div>
    </div>

    <div className="flex items-center gap-2 text-[14px] font-medium text-[#8b8e98]">
      <span>{mode}</span>
      <span className="flex flex-col items-center justify-center leading-none text-[#9ca0aa]">
        <span className="h-[8px] text-[12px] leading-[8px]">⌃</span>
        <span className="h-[8px] text-[12px] leading-[8px]">⌄</span>
      </span>
    </div>
  </button>

  {modeOpen && (
    <div className="absolute right-3 top-[50px] z-50 w-[150px] overflow-hidden rounded-[18px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={() => {
          setMode('Auto');
          setModeOpen(false);
        }}
        className="flex h-[48px] w-full items-center justify-between border-b border-[#eeeeea] px-4 text-left"
      >
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
          Auto
        </span>
        {mode === 'Auto' && (
          <span className="text-[16px] font-semibold text-[#111111]">✓</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode('Thinking');
          setModeOpen(false);
        }}
        className="flex h-[48px] w-full items-center justify-between border-b border-[#eeeeea] px-4 text-left"
      >
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
          Thinking
        </span>
        {mode === 'Thinking' && (
          <span className="text-[16px] font-semibold text-[#111111]">✓</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode('Fast');
          setModeOpen(false);
        }}
        className="flex h-[48px] w-full items-center justify-between px-4 text-left"
      >
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
          Fast
        </span>
        {mode === 'Fast' && (
          <span className="text-[16px] font-semibold text-[#111111]">✓</span>
        )}
      </button>
    </div>
  )}
</div>

        <div className="mx-4 h-px bg-[#e7e7e2]" />

        <div className="flex h-[58px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-[#111111]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 20 7.5 12 12 4 7.5 12 3Z" />
              <path d="M4 7.5V16.5L12 21 20 16.5V7.5" />
              <path d="M12 12V21" />
            </svg>

            <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
              Deep research
            </div>
          </div>
        </div>

        <div className="mx-4 h-px bg-[#e7e7e2]" />

        <div className="flex h-[58px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-[#111111]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21" />
              <path d="M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21" />
            </svg>

            <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
              Web search
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWebActive((v) => !v)}
            className={`relative h-[30px] w-[52px] rounded-full transition-all ${
              webActive ? 'bg-[#2f8cff]' : 'bg-[#d7d8dc]'
            }`}
          >
            <span
              className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-all ${
                webActive ? 'left-[25px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
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
