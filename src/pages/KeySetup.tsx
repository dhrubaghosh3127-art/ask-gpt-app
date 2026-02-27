import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserApiKey, setUserApiKey, clearUserApiKey } from "../utils/storage";

// OpenRouter keys page (external)
const OPENROUTER_KEYS_URL = "https://openrouter.ai/keys";

// চাইলে নিজের YouTube embed link বসাবে (না থাকলে খালি রাখো)
const TUTORIAL_VIDEO_EMBED = ""; // e.g. "https://www.youtube.com/embed/VIDEO_ID"

const KeySetup: React.FC = () => {
  const navigate = useNavigate();
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(getUserApiKey());
  }, []);

  const handleSave = () => {
    const k = key.trim();
    if (!k) return;
    setUserApiKey(k);
    navigate("/chat");
  };

  const handleClear = () => {
    clearUserApiKey();
    setKey("");
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add your API Key</h1>
            <p className="mt-1 text-sm text-gray-600">
              আপনার key শুধুই আপনার ডিভাইসে (localStorage) সেভ হবে। সার্ভারে সেভ/লগ হবে না।
            </p>
          </div>

          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-gray-600 underline"
            type="button"
          >
            Back to Chat
          </button>
        </div>

        {/* Tutorial */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold text-gray-900">How to get an OpenRouter API key</h2>

          <ol className="mt-2 list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>OpenRouter এ লগইন করো</li>
            <li>Keys page এ গিয়ে “Create Key” / “New Key” চাপো</li>
            <li>Key কপি করো</li>
            <li>নিচের box এ paste করে “Done” চাপো</li>
          </ol>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={OPENROUTER_KEYS_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
            >
              Open OpenRouter Keys
            </a>

            <button
              type="button"
              onClick={() => setKey("")}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm font-semibold border border-gray-200"
            >
              Clear Box
            </button>
          </div>

          {/* Optional video */}
          {TUTORIAL_VIDEO_EMBED ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <div className="aspect-video bg-black">
                <iframe
                  src={TUTORIAL_VIDEO_EMBED}
                  title="Tutorial"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              (Optional) তোমার tutorial video থাকলে উপরে <b>TUTORIAL_VIDEO_EMBED</b> এ YouTube embed link বসিয়ে দাও।
            </p>
          )}
        </div>

        {/* Key input */}
        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-900">Paste API Key</label>
          <textarea
            className="mt-2 w-full h-32 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Paste your OpenRouter API key here..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50"
            disabled={!key.trim()}
            type="button"
          >
            Done (Save & Use Unlimited)
          </button>

          <button
            onClick={handleClear}
            className="h-11 px-4 rounded-xl bg-gray-200 text-gray-900 font-semibold"
            type="button"
          >
            Clear Saved Key
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Tip: Daily limit শেষ হলে chat এ link দেখাবে—ওখানে tap করলেই এই page খুলবে (#/key).
        </p>
      </div>
    </div>
  );
};

export default KeySetup;
