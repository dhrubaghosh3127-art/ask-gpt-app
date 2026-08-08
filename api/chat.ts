// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
// ⚠️ ASSUMED PATH — confirm/fix this against your actual project structure.
import { messaging } from "../lib/firebaseAdmin";

export const config = { maxDuration: 30 };

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION NOTE: Groq (Qwen 3.6 27B) → Mistral AI
//
//   mistral-medium-latest (Mistral Medium 3.5) → THE one model for chat AND
//                      vision, always. It's natively multimodal, so no
//                      separate vision model is needed.
//
//   thinkingMode         → same explicit client flag as before, default false.
//                        false → reasoning_effort "none"
//                        true  → reasoning_effort "high"  (Mistral only has
//                                "none" / "high" — there is no "default")
//
//   web search            → Mistral's native web_search tool, via the
//                      Conversations API (/v1/conversations). This only
//                      works there, not on Chat Completions.
//
//                      The first attempt at this broke chat entirely: extra
//                      fields (completion_args.tool_choice, store, a
//                      role:"system" entry inside inputs) that seemed
//                      reasonable by analogy to the Agents API weren't
//                      actually confirmed for this specific endpoint, and
//                      Mistral rejected the request (422). This version
//                      sends ONLY what Mistral's own cookbook example
//                      confirms works — model, inputs, tools — plus exactly
//                      two additions that are independently documented on
//                      their own pages: `completion_args.reasoning_effort`
//                      (from the reasoning-effort docs) and a top-level
//                      `instructions` string for the system prompt (a
//                      confirmed field of the /v1/conversations start body,
//                      used instead of a role:"system" message in `inputs`
//                      since no official example ever puts system there).
//                      No tool_choice, no store — deliberately left out
//                      until confirmed necessary.
//
//   vision                 → unchanged from the last version: Chat
//                      Completions API, since web_search doesn't apply
//                      there anyway and this path was never broken.
//
//   streaming              → NOW REAL. Mistral's own /v1/conversations SSE
//                      stream (confirmed against Mistral's official raw
//                      event dump: `event: message.output.delta` / `data:
//                      {"type":"message.output.delta",...,"content":"..."}`,
//                      ending in `conversation.response.done`) is relayed
//                      straight through token-by-token, turned into the
//                      exact same delta shape the app already reads
//                      (`{choices:[{delta:{content|reasoning|sources}}]}`).
//                      Replaces the earlier fetch-the-whole-thing-then-
//                      simulate-chunks approach. The non-streaming
//                      (stream:false) path is kept as-is below it, unused by
//                      the app today but left in place as a working
//                      fallback.
//
//   sources                → NEW. When web_search fires, Mistral interleaves
//                      {type:"tool_reference",title,url,source} chunks into
//                      the answer content, alongside the normal {type:"text"}
//                      chunks — confirmed on Mistral's own Websearch docs
//                      page. These are pulled out, de-duplicated by URL, and
//                      sent as ONE extra delta (`sources`, a JSON string)
//                      before the reasoning/content deltas — same one-shot
//                      pattern as `reasoning`. Never sent if no search
//                      happened, so old app builds that ignore unknown delta
//                      keys are unaffected.
// ─────────────────────────────────────────────────────────────────────────────

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_CONVERSATIONS_URL = "https://api.mistral.ai/v1/conversations";
const MISTRAL_MODEL = "mistral-medium-latest";

// Mistral's own documented limit for images in a single request.
const MAX_VISION_IMAGES = 8;

const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information — this happens automatically through your own judgment, never by writing a tool call out as visible text.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you answer:
- Keep answers direct and to the point. Don't pad simple questions with unnecessary explanation.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), check the web for it first rather than guessing from memory.
- You DO have real web search access. Never say "I can't browse the internet", "I don't have access to real-time data", "I can't open links", or anything similar — that is false.
- After any tool result comes back, always write your final answer yourself in plain natural language — never show raw JSON, XML, tool syntax, or code blocks of tool output to the user.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

// Was: "You only analyze the image and extract the useful visible text...
// Do not add extra explanation unless necessary." — written for OCR/document
// extraction, not general photo Q&A. Mistral's own docs treat those as two
// different things (Vision vs Document AI) with different expected prompting.
// A narrow "just extract, don't explain" instruction against an open-ended
// question like "how does this look?" left the model with no clear task,
// and it would sometimes fall back to just repeating the question — this
// prompt removes that ambiguity directly.
const NEEDS_SEARCH_MARKER = "NEEDS_SEARCH:";

const VISION_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI, looking at a photo the user just sent.

Respond naturally and helpfully to whatever they're asking about the image — describe it, answer a question about it, solve a problem shown in it, explain it, or discuss it, whatever fits their message. Give a complete, clear, genuinely useful answer. Never just repeat the user's own question or message back as if it were the answer — if you are unsure what they mean, describe the image and make your best attempt at what they likely want to know.

You cannot browse the web from here, so answer fully from what you can see in the image and what you already know. Only in the rare case where answering properly truly needs current, real-time, or web-verifiable information you cannot know (recent events, live prices or status, whether something specific still exists or is open, verifying a fact tied to what's shown), do this instead of guessing:
1. In 2-5 short lines, say what you see in the image relevant to the question, and mention plainly that you'll check current information for it (e.g. "I can see you're asking about X — that needs current data, let me check.").
2. Then, on its own line by itself, write exactly:
${NEEDS_SEARCH_MARKER} <a clear, self-contained search query, written as if the image were not available — include any names, text, or details from the image that the query needs>
3. Write nothing after that line — the search and the rest of the answer happen next, on their own.

Only do this when the answer truly needs live/current information, not just because a question is hard.

Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].

Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

// Mistral returns errors as either a plain string message, OR (on a rejected/
// invalid request) an array of {loc, msg, type} validation-error objects —
// one per bad field. Dropping that array straight into a template string
// prints "[object Object],[object Object],..." because JS calls .toString()
// on each object. This turns either shape into one readable line, and is the
// direct fix for that bug.
function formatMistralError(data: any, raw: string, status: number): string {
  const m = data?.message ?? data?.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (Array.isArray(m) && m.length) {
    return m
      .map((e: any) => {
        const loc = Array.isArray(e?.loc) ? e.loc.join(".") : "";
        const msg = typeof e?.msg === "string" ? e.msg : JSON.stringify(e);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join("; ")
      .slice(0, 500);
  }
  if (m && typeof m === "object") {
    return (typeof m.message === "string" && m.message) || JSON.stringify(m).slice(0, 500);
  }
  return raw.slice(0, 300) || `Upstream error (HTTP ${status})`;
}

function sendDelta(res: VercelResponse, delta: Record<string, any>) {
  // Wrapped: once the client disconnects, further writes to it fail —
  // previously that failure would bubble up and break out of the read
  // loop below, stopping generation early. Swallowing it here means the
  // loop keeps reading Mistral's stream to completion regardless, which
  // is what lets the "reply ready" push notification fire correctly.
  try {
    res.write(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: null }] })}\n\n`);
  } catch {
    // client already gone — fine, generation continues regardless
  }
}

// Vercel's edge/reverse-proxy layer can buffer SSE responses — writing
// chunks with res.write() but only delivering them all at once at the end —
// unless told explicitly not to. `X-Accel-Buffering: no` is the standard,
// widely-documented header for this (originally an Nginx directive, also
// respected by Vercel's proxy layer); `no-transform` in Cache-Control
// additionally stops any intermediary from recompressing/rebuffering the
// stream. flushHeaders() sends the header block immediately instead of
// waiting for the first write, which some proxies use as the signal to
// start treating the connection as a real stream. None of this replaces
// also setting the `VERCEL_FORCE_NODEJS_STREAMING=true` project environment
// variable on Vercel's side — that's a platform-level switch this code
// can't flip for you.
function setSSEHeaders(res: VercelResponse) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();
}

type SourceRef = { title: string; url: string; source: string };

function dedupeSources(sources: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (!s.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

// Splits a Chat Completions `message.content` into the reasoning trace, the
// actual answer, and any web_search citations. Content is a plain string
// when reasoning_effort is "none", or an array of typed chunks when
// reasoning is on: {type:"thinking",thinking:[{type:"text",text}]} for the
// reasoning trace, {type:"text",text} for the answer, and (only via the
// Conversations API) {type:"tool_reference",title,url,source} for a
// citation — collected separately so it never leaks into the visible text.
function extractChatContent(content: any): { reasoning: string; text: string; sources: SourceRef[] } {
  if (typeof content === "string") return { reasoning: "", text: content.trim(), sources: [] };
  if (!Array.isArray(content)) return { reasoning: "", text: "", sources: [] };

  let reasoning = "";
  let text = "";
  const sources: SourceRef[] = [];
  for (const chunk of content) {
    if (chunk?.type === "thinking") {
      const inner = Array.isArray(chunk.thinking) ? chunk.thinking : [];
      reasoning += inner.map((x: any) => (typeof x?.text === "string" ? x.text : "")).join("");
    } else if (chunk?.type === "tool_reference") {
      if (typeof chunk.url === "string" && chunk.url) {
        sources.push({
          title: typeof chunk.title === "string" ? chunk.title : "",
          url: chunk.url,
          source: typeof chunk.source === "string" ? chunk.source : "",
        });
      }
    } else if (chunk?.type === "text" && typeof chunk.text === "string") {
      text += chunk.text;
    } else if (typeof chunk?.text === "string") {
      text += chunk.text; // defensive fallback for any other chunk type
    }
  }
  return { reasoning: reasoning.trim(), text: text.trim(), sources };
}

// Mistral's `inputs` entries are strict: MessageInputEntry only accepts
// role "user"/"assistant" (never "system") and exactly {role, content} —
// no extra fields. Groq/OpenAI-style APIs tolerate a stray system entry
// anywhere in the array, or extra client-side fields (id, timestamp, etc.);
// Mistral rejects the whole request outright if either shows up. This
// drops anything that isn't user/assistant and strips each entry down to
// just the two fields Mistral actually accepts.
function sanitizeInputs(messages: any[] | undefined): { role: string; content: any }[] {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m?.role === "user" || m?.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

// Same idea as extractChatContent above, but for the Conversations API's
// response shape: a top-level `outputs` array where the entry with
// `type === "message.output"` holds the reply. Confirmed directly against
// Mistral's own cookbook `display_response` helper.
function extractConversationOutput(outputs: any[]): { reasoning: string; text: string; sources: SourceRef[] } {
  let reasoning = "";
  let text = "";
  const sources: SourceRef[] = [];
  for (const entry of Array.isArray(outputs) ? outputs : []) {
    if (entry?.type !== "message.output") continue;
    const parsed = extractChatContent(entry.content);
    reasoning += parsed.reasoning;
    text += parsed.text;
    sources.push(...parsed.sources);
  }
  return { reasoning: reasoning.trim(), text: text.trim(), sources };
}

// Relays Mistral's OWN live SSE stream straight through, turning it into the
// exact same delta format the app already reads (`{choices:[{delta:{...}}]}`)
// — real token-by-token pacing this time, not the old fetch-then-simulate-
// chunks approach. Confirmed directly against Mistral's own docs raw event
// dump: `event: message.output.delta` / `data:{"type":"message.output.delta",
// ...,"content":"..."}`, ending in `conversation.response.done`. `content` on
// each delta can be a plain string OR (during reasoning) one of the same
// {type:"thinking"|"text"|"tool_reference"} chunks the non-streaming path
// already handles — same extraction logic, just applied per-delta instead
// of to one final blob.
// Fires once, only when the client disconnected before the reply finished
// and a device token was provided. Uses FCM's "notification" payload (not
// data-only) so Android displays it automatically even if the app process
// isn't running — no app-side code has to wake up to show it. Never throws
// outward; a failed push should never affect the request/response cycle
// that's already finished by the time this runs.
async function sendCompletionPush(token: string, replyText: string): Promise<void> {
  const SNIPPET_LEN = 150;
  const snippet = replyText.length > SNIPPET_LEN
    ? replyText.slice(0, SNIPPET_LEN).trim() + "…"
    : replyText;
  try {
    await messaging.send({
      token,
      notification: { title: "Eliyen replied", body: snippet },
    });
  } catch (err) {
    console.log(`[fcm-push] failed: ${(err as any)?.message || err}`);
  }
}

async function relayMistralStream(
  apiKey     : string,
  request    : Record<string, any>,
  res        : VercelResponse,
  skipHeaders: boolean = false,
  fcmToken   : string | undefined = undefined,
): Promise<void> {
  // Tracks whether the client is still there. res's own 'close' event also
  // fires on a completely normal finish (after res.end()) — checking
  // writableEnded at that moment is what tells apart "client actually left
  // early" from "we were already done anyway".
  let clientConnected = true;
  res.on("close", () => {
    if (!res.writableEnded) clientConnected = false;
  });
  let fullText = "";

  let upstream: Response;
  try {
    upstream = await fetch(MISTRAL_CONVERSATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...request, stream: true }),
    });
  } catch (err: any) {
    if (!skipHeaders) setSSEHeaders(res);
    sendDelta(res, { content: `⚠️ ${err?.message || "Network error reaching Mistral"}` });
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const raw = await upstream.text().catch(() => "");
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
    const realMsg = formatMistralError(data, raw, upstream.status);
    if (!skipHeaders) setSSEHeaders(res);
    sendDelta(res, { content: `⚠️ ${realMsg}` });
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  if (!skipHeaders) setSSEHeaders(res);
  console.log(`[mistral-stream] t=${Date.now()} type=upstream.connected`);

  const sources: SourceRef[] = [];
  let sourcesSent = false;
  const flushSources = () => {
    if (sourcesSent) return;
    const deduped = dedupeSources(sources);
    if (deduped.length) sendDelta(res, { sources: JSON.stringify(deduped) });
    sourcesSent = true;
  };

  // One already-JSON-parsed delta's `content` value — string, single chunk
  // object, or array of chunks. Sources are held back and flushed (once)
  // right before the first real visible content, same one-shot-first
  // ordering the old simulated path used.
  const relayContent = (content: any) => {
    if (typeof content === "string") {
      if (content) { flushSources(); fullText += content; sendDelta(res, { content }); }
      return;
    }
    const chunks = Array.isArray(content) ? content : content ? [content] : [];
    for (const chunk of chunks) {
      if (chunk?.type === "thinking") {
        const inner = Array.isArray(chunk.thinking) ? chunk.thinking : [];
        const piece = inner.map((x: any) => (typeof x?.text === "string" ? x.text : "")).join("");
        if (piece) sendDelta(res, { reasoning: piece });
      } else if (chunk?.type === "tool_reference") {
        if (typeof chunk.url === "string" && chunk.url) {
          sources.push({
            title: typeof chunk.title === "string" ? chunk.title : "",
            url: chunk.url,
            source: typeof chunk.source === "string" ? chunk.source : "",
          });
        }
      } else if (typeof chunk?.text === "string" && chunk.text) {
        flushSources();
        fullText += chunk.text;
        sendDelta(res, { content: chunk.text });
      }
    }
  };

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue; // skips blank lines and "event: ..." lines — type is inside the JSON too
        const jsonStr = line.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        let evt: any = null;
        try { evt = JSON.parse(jsonStr); } catch { continue; } // malformed/partial — skip, never crash the stream

        // TEMPORARY diagnostic — visible in Vercel's function logs (Project →
        // Deployments → a request → Logs). Shows the real event type/size and
        // arrival time, so we can see directly whether Mistral itself is
        // sending many small pieces over time (real token streaming) or a
        // few large ones close together (Mistral-side batching) — rather
        // than guessing further. Safe to remove once confirmed either way.
        console.log(
          `[mistral-stream] t=${Date.now()} type=${evt?.type} contentLen=${
            typeof evt?.content === "string" ? evt.content.length
            : Array.isArray(evt?.content) ? `array(${evt.content.length})`
            : typeof evt?.content
          }`,
        );
  if (evt?.type === "message.output.delta") {
          relayContent(evt.content);
        } else if (evt?.type === "conversation.response.done") {
          flushSources();
        }
        // conversation.response.started / tool.execution.started / .done — no client-facing action needed
      }
    }
  } catch {
    // upstream connection dropped mid-stream — end gracefully below rather than hanging the client
  }

  flushSources();

  // Client left before the reply finished — the full text is fully
  // assembled now, so send the "reply ready" push. Never sent while the
  // client is still connected (they're already watching it stream live).
  if (!clientConnected && fcmToken && fullText.trim()) {
    await sendCompletionPush(fcmToken, fullText.trim());
  }

  try {
    res.write("data: [DONE]\n\n");
    res.end();
  } catch {
    // client already gone — nothing left to finish
  }
}

// Step 2 of the vision pipeline — only reached when the vision step itself
// flagged (via NEEDS_SEARCH_MARKER) that it needs current/verifiable info it
// can't get from the image alone. Text-only Conversations API call with
// tools:[web_search] always available — exactly the same pattern normal chat
// already uses below (see wantsThinking/effort) — Mistral's own reasoning
// decides whether to actually invoke the search, this doesn't force it.
// skipHeaders=true in the normal case: the vision step already streamed its
// own short, real acknowledgment to the user before handing off here, so
// this continues that same message rather than starting a fresh SSE response.
const VISION_SEARCH_FOLLOWUP_INSTRUCTIONS = (
  "You are Eliyen, an AI assistant built by PROHOR AI. You were just looking at a " +
  "photo a user sent and told them you'd check current information. Search the web " +
  "for what's needed and continue naturally into the full answer to their question — " +
  "don't restart or re-introduce yourself, just continue where you left off. " +
  "Write math in plain notation (x^2, 1/x, sqrt(x), >=, <=), never raw LaTeX."
);

async function runVisionSearchFollowUp(
  apiKey        : string,
  originalPrompt: string,
  searchQuery   : string,
  effort        : "none" | "high",
  res           : VercelResponse,
  skipHeaders   : boolean,
): Promise<void> {
  const requestBody = {
    model: MISTRAL_MODEL,
    instructions: VISION_SEARCH_FOLLOWUP_INSTRUCTIONS,
    inputs: [
      { role: "user", content:
          `The user sent a photo and asked: "${originalPrompt}"\n\n` +
          `You need this current information to finish answering: ${searchQuery}\n\n` +
          `Search for it now and continue straight into the full answer.`,
      },
    ],
    tools: [{ type: "web_search" }],
    completion_args: { reasoning_effort: effort },
  };
  await relayMistralStream(apiKey, requestBody, res, skipHeaders);
}

// Vision pipeline entry point: streams the Chat Completions vision analysis
// line-by-line. Any natural-language text the model writes (e.g. a short "I
// can see X, checking current data for this" acknowledgment) streams straight
// to the client and stays visible — only the exact NEEDS_SEARCH_MARKER line
// itself is intercepted and hidden. When that line appears, control hands off
// to runVisionSearchFollowUp, which continues the SAME message with a real
// web-search-backed answer rather than replacing what was already shown.
async function handleVisionRequest(
  apiKey      : string,
  imageBlocks : { type: string; image_url: string }[],
  visionPrompt: string,
  effort      : "none" | "high",
  res         : VercelResponse,
): Promise<void> {
  let upstream: Response;
  try {
    upstream = await fetch(MISTRAL_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        temperature: 0.7,
        reasoning_effort: effort,
        stream: true,
        messages: [
          { role: "system", content: VISION_SYSTEM_PROMPT },
          { role: "user", content: [{ type: "text", text: visionPrompt }, ...imageBlocks] },
        ],
      }),
    });
  } catch (err: any) {
    setSSEHeaders(res);
    sendDelta(res, { content: `⚠️ ${err?.message || "Network error reaching Mistral"}` });
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const raw = await upstream.text().catch(() => "");
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
    setSSEHeaders(res);
    sendDelta(res, { content: `⚠️ ${formatMistralError(data, raw, upstream.status)}` });
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer  = "";     // raw SSE frame buffer (data: {...} lines)
  let lineBuffer = "";     // accumulated visible text not yet resolved into a complete line
  let headersSet = false;
  let handedOff  = false;

  const ensureHeaders = () => { if (!headersSet) { setSSEHeaders(res); headersSet = true; } };
  const flushText = (text: string) => { if (text) { ensureHeaders(); sendDelta(res, { content: text }); } };

  // A partial (no newline yet) line is only worth holding back if it could
  // still turn into the marker — otherwise flush it immediately so normal
  // text streams with no perceptible delay.
  const couldStillBecomeMarker = (s: string) => {
    const t = s.trimStart();
    return t.length === 0 || NEEDS_SEARCH_MARKER.startsWith(t) || t.startsWith(NEEDS_SEARCH_MARKER);
  };

  const handleCompleteLine = async (line: string): Promise<boolean> => {
    // Returns true if this line was the marker (caller should stop after this).
    const trimmed = line.trimStart();
    if (trimmed.startsWith(NEEDS_SEARCH_MARKER)) {
      const query = trimmed.slice(NEEDS_SEARCH_MARKER.length).trim();
      try { await reader.cancel(); } catch { /* ignore */ }
      handedOff = true;
      await runVisionSearchFollowUp(apiKey, visionPrompt, query, effort, res, headersSet);
      return true;
    }
    flushText(line);
    return false;
  };

  try {
    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = sseBuffer.indexOf("\n")) !== -1) {
        const sseLine = sseBuffer.slice(0, nl).trim();
        sseBuffer = sseBuffer.slice(nl + 1);
        if (!sseLine.startsWith("data:")) continue;
        const jsonStr = sseLine.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        let evt: any = null;
        try { evt = JSON.parse(jsonStr); } catch { continue; }
        const piece = evt?.choices?.[0]?.delta?.content;
        if (typeof piece !== "string" || !piece) continue;

        lineBuffer += piece;

        let textNl: number;
        while ((textNl = lineBuffer.indexOf("\n")) !== -1) {
          const completeLine = lineBuffer.slice(0, textNl + 1); // keep \n for natural spacing
          lineBuffer = lineBuffer.slice(textNl + 1);
          if (await handleCompleteLine(completeLine)) break outer;
        }

        // Trailing partial line (no \n yet) — flush now unless it could still
        // grow into the marker, so ordinary text has no artificial delay.
        if (lineBuffer && !couldStillBecomeMarker(lineBuffer)) {
          flushText(lineBuffer);
          lineBuffer = "";
        }
      }
    }
  } catch {
    // upstream dropped mid-stream — finalize with whatever's left below
  }

  if (!handedOff && lineBuffer) {
    await handleCompleteLine(lineBuffer);
  }

  if (!handedOff) {
    ensureHeaders();
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const {
      modelId, messages, userKey, userApiKey, prompt, systemInstruction, mode,
      audioBase64, imageBase64, images, mimeType, language, stream, thinkingMode,
      fcmToken,
    } = body as {
      modelId?: string; messages?: any[]; userKey?: string; userApiKey?: string;
      prompt?: string; systemInstruction?: string;
      mode?: "chat" | "image" | "transcribe" | "vision";
      audioBase64?: string; imageBase64?: string;
      images?: { data?: string; mimeType?: string }[];
      mimeType?: string;
      language?: string; stream?: boolean;
      thinkingMode?: boolean;
      // Current FCM token for this device — optional. Only used if the
      // client disconnects before the reply finishes, to push a "reply
      // ready" notification. Absent/omitted → behaves exactly as before.
      fcmToken?: string;
    };

    if (mode === "chat" && !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION MODE — untouched (Gemini/Imagen)
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "image") {
      const imagePrompt = (prompt || "").trim();
      if (hasUserKey) return res.status(403).json({ error: "Image generation is available only in admin mode" });
      if (!imagePrompt) return res.status(400).json({ error: "prompt is required" });

      const geminiApiKey = process.env.GEMINI_API_KEY || "";
      if (!geminiApiKey) return res.status(400).json({ error: "Missing API key (GEMINI_API_KEY)" });

      const actualImageModel =
        modelId === "imagen-4-fast-generate" ? "imagen-4.0-fast-generate-001"
        : modelId === "imagen-4-ultra-generate" ? "imagen-4.0-ultra-generate-001"
        : "imagen-4.0-generate-001";

      const imageRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualImageModel}:predict`,
        {
          method: "POST",
          headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: imagePrompt }], parameters: { sampleCount: 1 } }),
        }
      );
      const imageData = await imageRes.json().catch(() => null);
      if (!imageRes.ok) {
        return res.status(imageRes.status).json({
          error: imageData?.error?.message || imageData?.error || "Image generation failed",
        });
      }
      const imageBytes =
        imageData?.predictions?.[0]?.bytesBase64Encoded ||
        imageData?.predictions?.[0]?.image?.bytesBase64Encoded ||
        imageData?.generatedImages?.[0]?.image?.imageBytes || "";
      if (!imageBytes) return res.status(502).json({ error: "No image bytes returned from Gemini" });

      return res.status(200).json({ imageUrl: `data:image/png;base64,${imageBytes}`, modelId: actualImageModel });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VISION MODE — Mistral Medium 3.5 (natively multimodal), Chat Completions
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "vision") {
      if (hasUserKey) return res.status(403).json({ error: "Image analysis is available only in admin mode" });

      const mistralApiKey = process.env.MISTRAL_API_KEY || "";
      if (!mistralApiKey) return res.status(400).json({ error: "Missing API key (MISTRAL_API_KEY)" });

      // images[] is the current shape (multi-image). imageBase64 is read too,
      // as a single-image fallback, purely so an older client build can't
      // silently send nothing — the app always sends images[] now.
      const rawImages = Array.isArray(images) && images.length > 0
        ? images
        : (imageBase64 ? [{ data: imageBase64, mimeType }] : []);

      if (rawImages.length === 0) return res.status(400).json({ error: "images is required" });

      // Mistral's own documented limit is 8 images per request — enforced
      // here too (defense in depth; the app already stops the user at 8).
      if (rawImages.length > MAX_VISION_IMAGES) {
        return res.status(400).json({ error: `Too many images — max ${MAX_VISION_IMAGES} per message` });
      }

      const imageContentBlocks = rawImages
        .map((img) => {
          const clean = (img.data || "").replace(/^data:.*;base64,/, "").trim();
          if (!clean) return null;
          const mt = (img.mimeType || "image/jpeg").trim() || "image/jpeg";
          // Mistral takes image_url as a plain string, NOT a {url:...}
          // object the way the old Groq/OpenAI-style call did.
          return { type: "image_url", image_url: `data:${mt};base64,${clean}` };
        })
        .filter((block): block is { type: string; image_url: string } => block !== null);

      if (imageContentBlocks.length === 0) return res.status(400).json({ error: "No valid image data" });

      const visionPrompt = (prompt || "").trim() ||
        (imageContentBlocks.length > 1
          ? "If these images contain a question, problem, or task, work through it and give the actual answer. Otherwise, describe what's shown in detail and anything notable."
          : "If this image contains a question, problem, or task, work through it and give the actual answer — don't just describe that a question exists. Otherwise, describe what's shown in detail and anything notable.");

      // Same rule as normal chat below (wantsThinking/effort): the attach-bar
      // toggle sends thinkingMode:true for exactly one message, then resets —
      // this just reads whatever it's sent per-request. none/high are the
      // only two levels Mistral exposes.
      const visionEffort = thinkingMode === true ? "high" : "none";

      await handleVisionRequest(mistralApiKey, imageContentBlocks, visionPrompt, visionEffort, res);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCRIBE MODE — untouched (Groq Whisper)
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "transcribe") {
      if (hasUserKey) return res.status(403).json({ error: "Voice transcription is available only in admin mode" });

      const groqApiKey = process.env.GROQ_API_KEY || "";
      if (!groqApiKey) return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });

      const cleanBase64 = (audioBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanBase64) return res.status(400).json({ error: "audioBase64 is required" });

      const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
      const audioBuffer = Buffer.from(cleanBase64, "base64");
      const audioBlob = new Blob([audioBuffer], { type: actualMimeType });
      const ext = actualMimeType.includes("wav") ? "wav"
        : actualMimeType.includes("ogg") ? "ogg"
        : actualMimeType.includes("mp4") ? "mp4"
        : actualMimeType.includes("mpeg") || actualMimeType.includes("mp3") ? "mp3" : "webm";

      const formData = new FormData();
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");
      if (language && language.trim()) formData.append("language", language.trim());

      const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: `Bearer ${groqApiKey}` }, body: formData,
      });
      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try { sttData = sttRaw ? JSON.parse(sttRaw) : null; } catch { sttData = { text: sttRaw }; }
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: sttData?.error?.message || sttData?.error || "Transcription failed" });

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";
      return res.status(200).json({ text, modelId: "whisper-large-v3-turbo" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT MODE — Mistral Medium 3.5 via the Conversations API, with native
    // web_search. Request shape follows Mistral's own cookbook example as
    // closely as possible — see the header note for exactly what was added
    // on top and why.
    // ═══════════════════════════════════════════════════════════════════════

    const apiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)" });
    }

    // System prompt goes through the dedicated `instructions` field, not a
    // role:"system" entry inside `inputs` — no official example ever puts
    // system there, and `instructions` is confirmed as its own top-level
    // field on the /v1/conversations start body.
    const customSystemText = typeof systemInstruction === "string" ? systemInstruction.trim() : "";
    const instructionsText = [ELIYEN_SYSTEM_PROMPT, customSystemText].filter(Boolean).join("\n\n");

    // Deterministic, UI-controlled — never guessed from message content.
    // Same behaviour as before: the Android app's attach-button toggle sends
    // thinkingMode:true for exactly one message, then goes back to false —
    // this backend just reads whatever it's sent per-request.
    const wantsThinking = thinkingMode === true;
        const effort = wantsThinking ? "high" : "none"; // Mistral only has none/high, no "default"

    const requestBody = {
      model: MISTRAL_MODEL,
      instructions: instructionsText,
      inputs: sanitizeInputs(messages),
      tools: [{ type: "web_search" }],
      completion_args: { reasoning_effort: effort },
    };

    // Real, live, token-by-token streaming — Mistral's own pacing relayed
    // straight through, not the old fetch-then-simulate-chunks approach.
    if (mode === "chat" && stream) {
      await relayMistralStream(apiKey, requestBody, res, false, fcmToken);
      return;
    }

    // Non-streaming fallback (stream:false) — unchanged from before.
    const chatRes = await fetch(MISTRAL_CONVERSATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ ...requestBody, stream: false }),
    });

    const chatRaw = await chatRes.text();
    let chatData: any = null;
    try { chatData = chatRaw ? JSON.parse(chatRaw) : null; } catch { chatData = null; }

    if (!chatRes.ok || !chatData) {
      const realMsg = formatMistralError(chatData, chatRaw, chatRes.status);
      return res.status(chatRes.status || 502).json({ error: realMsg });
    }

    const { reasoning, text, sources: rawSources } = extractConversationOutput(chatData?.outputs);
    const sources = dedupeSources(rawSources);
    const cleanContent = text || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleanContent, sources });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
}
        
        
