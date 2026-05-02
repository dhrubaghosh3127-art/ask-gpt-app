import { db } from "./_lib/firebaseAdmin";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const now = new Date().toISOString();

    const ref = db.collection("discoverSystem").doc("test");

    await ref.set(
      {
        status: "ok",
        message: "Firebase Admin connected from Vercel",
        updatedAt: now,
      },
      { merge: true }
    );

    const snap = await ref.get();

    return res.status(200).json({
      ok: true,
      data: snap.data(),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
      }
