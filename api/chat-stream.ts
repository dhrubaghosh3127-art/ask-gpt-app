import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_SYSTEM_PROMPT =
  'You are ASK-GPT, a helpful AI assistant. Answer clearly, naturally, and helpfully.';

const extractTextFromContent = (content: any): string => {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part: any) =>
        typeof part === 'string'
          ? part
          : typeof part?.text === 'string'
          ? part.text
          : typeof part?.content === 'string'
          ? part.content
          : ''
      )
      .join(' ')
      .trim();
  }

  return '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      modelId,
      messages,
      userApiKey,
      userKey,
      prompt,
      systemInstruction,
      imageBase64,
      mimeType,
    } = body as {
      modelId?: string;
      messages?: any[];
      userApiKey?: string;
      userKey?: string;
      prompt?: string;
      systemInstruction?: string;
      imageBase64?: string;
      mimeType?: string;
    };

    const keyFromClient = String(userApiKey || userKey || '').trim();
    const apiKey = keyFromClient || process.env.GROQ_API_KEY || '';

    if (!apiKey) {
      return res.status(400).json({
        error: keyFromClient
          ? 'Missing API key'
          : 'Missing API key (GROQ_API_KEY)',
      });
    }

    const finalModelId = modelId || 'llama-3.3-70b-versatile';

    const safeSystem =
      typeof systemInstruction === 'string' && systemInstruction.trim()
        ? systemInstruction.trim()
        : DEFAULT_SYSTEM_PROMPT;

    const historyMessages = Array.isArray(messages)
      ? messages.slice(-12).map((m: any) => ({
          role: m.role === 'model' ? 'assistant' : m.role || 'user',
          content: extractTextFromContent(m.content),
        }))
      : [];

    const finalMessages = [
      {
        role: 'system',
        content: safeSystem,
      },
      ...historyMessages,
      {
        role: 'user',
        content: String(prompt || '').slice(0, 4000),
      },
    ].filter((m) => m.content && String(m.content).trim());

    const requestBody: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
      stream: true,
    };

    if (imageBase64) {
      const cleanImageBase64 = String(imageBase64)
        .replace(/^data:.*;base64,/, '')
        .trim();

      const actualMimeType = String(mimeType || 'image/jpeg').trim() || 'image/jpeg';
      const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;

      requestBody.messages = [
        {
          role: 'system',
          content: safeSystem,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: String(prompt || 'Analyze this image.').slice(0, 4000),
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ];
    }

    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok || !upstream.body) {
      const rawError = await upstream.text().catch(() => '');
      let data: any = null;

      try {
        data = rawError ? JSON.parse(rawError) : null;
      } catch {
        data = null;
      }

      return res.status(upstream.status || 500).json({
        error:
          data?.error?.message ||
          data?.error ||
          rawError.slice(0, 300) ||
          'Streaming API error',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }

      res.end();
    } catch {
      res.end();
    }
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Streaming server error',
    });
  }
}
