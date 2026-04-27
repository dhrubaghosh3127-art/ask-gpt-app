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
    <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-[#fbfcf8] px-6 pt-4 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]">
      <div className="mx-auto mb-5 h-[7px] w-[68px] rounded-full bg-[#c7c7c2]" />

      <div className="mb-5 flex items-center justify-between">
        <div className="text-[26px] font-bold tracking-[-0.03em] text-[#143238]">
          Models
        </div>

        <button
          type="button"
          onClick={() => setModelOpen(false)}
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f1f3f0] text-[34px] leading-none text-[#143238]"
          aria-label="Close models"
        >
          ×
        </button>
      </div>

      <div className="mb-5 rounded-[22px] border border-[#0f7a83] bg-[#eaf7f6] px-5 py-4">
        <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#143238]">
          Explore ASK-GPT models
        </div>
        <div className="mt-1 text-[14px] leading-6 text-[#657174]">
          View available and locked AI models inside ASK-GPT.
        </div>
      </div>

      <div className="mb-6 h-px w-full bg-[#d8ddd7]" />

      <div className="space-y-3">
        {[
          {
            name: 'Llama 3.3 70B',
            desc: 'Fast and balanced for everyday chat, writing, and general tasks.',
            icon: 'L',
            locked: false,
          },
          {
            name: 'GPT-OSS 120B',
            desc: 'Hard reasoning, math solving, coding, and deep problem analysis.',
            icon: 'G',
            locked: false,
          },
          {
            name: 'GPT-OSS 20B',
            desc: 'Quick reasoning and lightweight problem solving.',
            icon: 'G',
            locked: false,
          },
          {
            name: 'Qwen 3-32B',
            desc: 'Strong multilingual model for Bangla, English, writing, and coding.',
            icon: 'Q',
            locked: false,
          },
          {
            name: 'GPT-5.5',
            desc: 'Advanced reasoning and high-quality responses for complex tasks.',
            icon: 'G',
            locked: true,
          },
          {
            name: 'Gemini 3.1 Pro',
            desc: 'Strong for multimodal understanding, long-context tasks, and smart analysis.',
            icon: '✦',
            locked: true,
          },
          {
            name: 'Claude Sonnet 4.6',
            desc: 'Excellent for writing, analysis, and clear natural responses.',
            icon: '✺',
            locked: true,
          },
          {
            name: 'Claude Opus 4.7',
            desc: 'Top-tier deep reasoning, creative writing, and high-level problem solving.',
            icon: '✺',
            locked: true,
          },
        ].map((model) => (
          <div
            key={model.name}
            className={`flex w-full items-center gap-4 rounded-[24px] px-4 py-4 ${
              model.locked ? 'opacity-55' : ''
            }`}
          >
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#eef1ee] text-[18px] font-bold text-[#6f7775]">
              {model.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[20px] font-semibold tracking-[-0.02em] text-[#111111]">
                {model.name}
              </div>
              <div className="mt-1 text-[13px] leading-5 text-[#6f7775]">
                {model.desc}
              </div>
            </div>

            {model.locked && (
              <svg
                className="h-7 w-7 shrink-0 text-[#6f7775]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
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
