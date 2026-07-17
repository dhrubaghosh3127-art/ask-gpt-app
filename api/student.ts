// ============================================================
// ELIYEN 1 — Student Mode RAG Endpoint
// ============================================================
// Pipeline: student question → embed (Cloudflare Workers AI, bge-m3)
//   → Qdrant retrieval (intent-based filtering, same as the Colab script)
//   → Eliyen 1 persona prompt → Mistral → answer
//
// Vercel Environment Variables needed:
//   QDRANT_URL       — same as Colab QDRANT_URL
//   QDRANT_API_KEY   — same as Colab QDRANT_API_KEY
//   CF_ACCOUNT_ID    — Cloudflare dashboard → Account ID
//   CF_API_TOKEN     — Cloudflare dashboard → My Profile → API Tokens
//                       (needs "Workers AI: Read" or "Edit" permission)
//   MISTRAL_API_KEY  — same key already used in chat.ts
//
// package.json needs "@qdrant/js-client-rest" in dependencies (see the
// package.json diff provided alongside this file). No local npm install
// needed — Vercel installs it automatically on deploy once it's in
// package.json and pushed to GitHub.
//
// ⚠️ Verified against official docs where I could (Qdrant JS client method
// shape, Cloudflare bge-m3 REST response shape — both confirmed accurate
// via docs.qdrant.io / developers.cloudflare.com). The ONE thing I could
// NOT independently verify is the exact current Mistral model ID string —
// check https://docs.mistral.ai/getting-started/models/ if generation
// calls ever fail with a "model not found" style error.
// ============================================================

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = "eliyen1_bangladesh_ssc_physics";
const CF_EMBED_MODEL = "@cf/baai/bge-m3";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-medium-2508";

// Per-step network timeout. Vercel Hobby plan caps a function at 10s total;
// Pro at 60s. Three sequential network calls (embed → qdrant → mistral)
// need headroom — keep each step well under whatever your plan's total is.
const STEP_TIMEOUT_MS = 15000;

// ── Eliyen 1 persona — same as the Colab script, unchanged ────────────────
const ELIYEN_PERSONA = `তুমি Eliyen 1 — বাংলাদেশের SSC/HSC শিক্ষার্থীদের জন্য একজন অভিজ্ঞ, যত্নশীল
পদার্থবিজ্ঞান শিক্ষক, ঠিক যেমন একজন ভালো BUET-পড়ুয়া প্রাইভেট টিউটর।

নিয়মাবলী:
1. শুধু নিচে দেওয়া "প্রাসঙ্গিক তথ্য" থেকে উত্তর দাও। এর বাইরের কিছু নিজে থেকে বানিয়ে বলবে না।
2. যদি দেওয়া তথ্যে উত্তর না থাকে, সরাসরি বলে দাও "এই নির্দিষ্ট তথ্য আমার কাছে নেই" — অনুমান করে ভুল কিছু বলবে না।
3. ছাত্র যদি চাপ বা দুশ্চিন্তায় থাকে (পরীক্ষার আগে, কম সময়), প্রথমে শান্ত করো, তারপর practical পরামর্শ দাও।
4. ব্যাখ্যা বাংলায় (বা Banglish, ছাত্র যেভাবে জিজ্ঞেস করেছে সেভাবে) দাও, সহজ ভাষায়।
5. সূত্র/সমীকরণ থাকলে ধাপে ধাপে দেখাও।
6. Board question হলে, কোন board/সাল থেকে এসেছে সেটা উল্লেখ করো (তথ্যে থাকলে)।`;

// ── Intent detection — same keyword list as the Colab script ──────────────
const EXAM_STRATEGY_KEYWORDS = [
  "exam", "পরীক্ষা", "প্রস্তুতি", "preparation", "কি পড়ব", "কী পড়ব",
  "ঘণ্টা আগে", "রেডি", "ready", "কম সময়", "শর্টকাট", "tension", "টেনশন",
];

function detectIntent(query: string): "exam_strategy" | "general" {
  const qLower = query.toLowerCase();
  const isExamStrategy = EXAM_STRATEGY_KEYWORDS.some((kw) =>
    qLower.includes(kw.toLowerCase())
  );
  return isExamStrategy ? "exam_strategy" : "general";
}

// ── Small helper: fetch with a hard timeout, so one slow upstream call ────
// can't silently hang the whole serverless invocation past its limit.
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  stepLabel: string
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`[${stepLabel}] timed out after ${timeoutMs}ms`);
    }
    throw new Error(`[${stepLabel}] network error: ${err?.message || err}`);
  } finally {
    clearTimeout(timer);
  }
}

// ── Step 1: turn the student's question into a vector ─────────────────────
// Same model (bge-m3) as what the 89 chunks were uploaded with — vectors
// stay compatible, no need to re-upload anything in Qdrant.
async function embedQuery(text: string): Promise<number[]> {
  const accountId = process.env.CF_ACCOUNT_ID || "";
  const apiToken = process.env.CF_API_TOKEN || "";
  if (!accountId || !apiToken) {
    throw new Error("[embed] Missing CF_ACCOUNT_ID or CF_API_TOKEN");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_EMBED_MODEL}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text] }),
    },
    STEP_TIMEOUT_MS,
    "embed"
  );

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`[embed] Cloudflare returned non-JSON: ${raw.slice(0, 200)}`);
  }

  if (!res.ok || data?.success !== true) {
    const msg = data?.errors?.[0]?.message || raw.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(`[embed] Cloudflare error: ${msg}`);
  }

  // Confirmed shape from Cloudflare's own docs: { result: { data: [[...]] } }
  const vector = data?.result?.data?.[0];
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("[embed] Unexpected response shape — no vector in result.data[0]");
  }
  return vector;
}

// ── Step 2: retrieve relevant context from Qdrant ──────────────────────────
// Mirrors the Colab retrieve_context() function, including the
// exam-strategy filter + fallback-fill-if-too-few-results logic.
async function retrieveContext(
  qdrant: QdrantClient,
  query: string,
  topK = 5
): Promise<{ context: string; sourcesUsed: number }> {
  const queryVector = await embedQuery(query);
  const intent = detectIntent(query);

  let results: any[] = [];

  try {
    if (intent === "exam_strategy") {
      const filtered = await qdrant.query(COLLECTION_NAME, {
        query: queryVector,
        filter: {
          should: [
            { key: "content_type", match: { value: "Exam_Trend_Analysis" } },
            { key: "content_type", match: { value: "Trick_Shortcut" } },
          ],
        },
        limit: topK,
        with_payload: true,
      });
      results = filtered.points || [];

      // Same fallback as the Colab script — if the filtered search comes
      // up thin, fill in with a general (unfiltered) search too.
      if (results.length < 3) {
        const extra = await qdrant.query(COLLECTION_NAME, {
          query: queryVector,
          limit: topK,
          with_payload: true,
        });
        const seenIds = new Set(results.map((r) => r.id));
        for (const p of extra.points || []) {
          if (!seenIds.has(p.id)) results.push(p);
        }
      }
    } else {
      const general = await qdrant.query(COLLECTION_NAME, {
        query: queryVector,
        limit: topK,
        with_payload: true,
      });
      results = general.points || [];
    }
  } catch (err: any) {
    throw new Error(`[qdrant] retrieval failed: ${err?.message || err}`);
  }

  if (results.length === 0) {
    // Not a hard error — the persona itself is instructed to say "I don't
    // have this specific information" when the context is empty. Let it
    // through so that honest behavior kicks in downstream.
    return { context: "", sourcesUsed: 0 };
  }

  const contextParts = results.map((r) => {
    const payload = r.payload || {};
    const contentType = payload.content_type || "";
    let text = "";

    if (contentType === "Board_Question") {
      text = payload.stimulus || "";
      const subQuestions = Array.isArray(payload.sub_questions) ? payload.sub_questions : [];
      for (const sq of subQuestions) {
        text += `\n${sq?.part || ""}. ${sq?.question || ""}`;
      }
    } else if (contentType === "MCQ_Bank") {
      text = `প্রশ্ন: ${payload.question || ""}\nউত্তর: ${payload.correct_answer || ""}\nব্যাখ্যা: ${payload.solution || ""}`;
    } else {
      text = payload.text || payload.recommendation || "";
    }

    return `[উৎস: ${contentType}]\n${text}`;
  });

  return { context: contextParts.join("\n\n---\n\n"), sourcesUsed: results.length };
}

// ── Step 3: generate the answer via Mistral ────────────────────────────────
async function generateAnswer(studentQuestion: string, context: string): Promise<string> {
  const mistralApiKey = process.env.MISTRAL_API_KEY || "";
  if (!mistralApiKey) throw new Error("[generate] Missing MISTRAL_API_KEY");

  const safeContext = context || "(কোনো প্রাসঙ্গিক তথ্য খুঁজে পাওয়া যায়নি)";

  const prompt = `${ELIYEN_PERSONA}

প্রাসঙ্গিক তথ্য (শুধু এখান থেকেই উত্তর দাও):
${safeContext}

ছাত্রের প্রশ্ন: ${studentQuestion}

উত্তর:`;

  const res = await fetchWithTimeout(
    MISTRAL_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${mistralApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.5,
      }),
    },
    STEP_TIMEOUT_MS,
    "generate"
  );

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`[generate] Mistral returned non-JSON: ${raw.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || raw.slice(0, 250) || `HTTP ${res.status}`;
    throw new Error(`[generate] Mistral error: ${msg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("[generate] Mistral returned an empty answer");
  }
  return content.trim();
}

// ── Vercel handler ───────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question } = req.body || {};
  const studentQuestion = typeof question === "string" ? question.trim() : "";

  if (!studentQuestion) {
    return res.status(400).json({ error: "question is required" });
  }
  if (studentQuestion.length > 2000) {
    return res.status(400).json({ error: "question is too long (max 2000 characters)" });
  }

  const qdrantUrl = process.env.QDRANT_URL || "";
  const qdrantApiKey = process.env.QDRANT_API_KEY || "";
  if (!qdrantUrl || !qdrantApiKey) {
    return res.status(400).json({ error: "Missing QDRANT_URL or QDRANT_API_KEY" });
  }

  try {
    const qdrant = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

    const { context, sourcesUsed } = await retrieveContext(qdrant, studentQuestion);
    const answer = await generateAnswer(studentQuestion, context);

    return res.status(200).json({
      text: answer,
      modelId: "eliyen-1-flash",
      sourcesUsed,
    });
  } catch (err: any) {
    // err.message is already step-labeled (e.g. "[embed] ...", "[qdrant] ...",
    // "[generate] ...") so the Vercel logs immediately show which stage failed.
    console.error("[student.ts]", err?.message || err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}

