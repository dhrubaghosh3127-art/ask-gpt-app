export type StreamMessage = {
  role: 'system' | 'user' | 'assistant' | 'model';
  content: string;
};

export type StreamChatParams = {
  modelId: string;
  messages: StreamMessage[];
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  userApiKey?: string;
  userKey?: string;
  onChunk: (chunk: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: Error) => void;
};

const extractTextFromStreamJson = (data: any): string => {
  const choice = data?.choices?.[0];

  const deltaContent = choice?.delta?.content;
  if (typeof deltaContent === 'string') return deltaContent;

  const messageContent = choice?.message?.content;
  if (typeof messageContent === 'string') return messageContent;

  const text = choice?.text;
  if (typeof text === 'string') return text;

  const outputText = data?.output_text;
  if (typeof outputText === 'string') return outputText;

  const directText = data?.text;
  if (typeof directText === 'string') return directText;

  return '';
};

export const streamChatResponse = async ({
  modelId,
  messages,
  prompt,
  systemInstruction = '',
  imageBase64 = '',
  mimeType = '',
  userApiKey = '',
  userKey = '',
  onChunk,
  onDone,
  onError,
}: StreamChatParams): Promise<string> => {
  let fullText = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'chat',
        stream: true,
        modelId,
        messages,
        prompt,
        systemInstruction,
        imageBase64,
        mimeType,
        userApiKey,
        userKey,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(errorText || `Streaming failed with status ${res.status}`);
    }

    if (!res.body) {
      throw new Error('Streaming response body is empty');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) continue;

        const payload = trimmed.startsWith('data:')
          ? trimmed.replace(/^data:\s*/, '')
          : trimmed;

        if (!payload || payload === '[DONE]') continue;

        let chunk = '';

        try {
          const parsed = JSON.parse(payload);
          chunk = extractTextFromStreamJson(parsed);
        } catch {
          chunk = payload;
        }

        if (chunk) {
          fullText += chunk;
          onChunk(chunk);
        }
      }
    }

    if (buffer.trim()) {
      const payload = buffer.trim().startsWith('data:')
        ? buffer.trim().replace(/^data:\s*/, '')
        : buffer.trim();

      if (payload && payload !== '[DONE]') {
        let chunk = '';

        try {
          const parsed = JSON.parse(payload);
          chunk = extractTextFromStreamJson(parsed);
        } catch {
          chunk = payload;
        }

        if (chunk) {
          fullText += chunk;
          onChunk(chunk);
        }
      }
    }

    onDone?.(fullText);
    return fullText;
  } catch (error) {
    const finalError =
      error instanceof Error ? error : new Error('Unknown streaming error');

    onError?.(finalError);
    throw finalError;
  }
};
