import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserApiKey, setUserApiKey, clearUserApiKey } from "../utils/storage";

const VIDEO_EMBED_URL = "https://www.youtube.com/embed/VIDEO_ID_HERE"; // তোমার ভিডিও হলে VIDEO_ID বসাবে

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
      <div className="w-full max-w-2xl rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-200 p-5">
        <h1 className="text-xl font-bold text-gray-900">Settings → Unlimited Use</h1>
        <p className="mt-1 text-sm text-gray-600">
          আপনার API Key শুধু আপনার ডিভাইসে (localStorage) সেভ হবে। সার্ভারে স্টোর হবে না।
        </p>

        {/* Tutorial */}
        <div className="mt-4 rounded-2xl bg-white border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900">How to get OpenRouter API Key</h2>
          <ol className="mt-2 text-sm text-gray-700 list-decimal pl-5 space-y-1">
            <li>
              OpenRouter এ অ্যাকাউন্ট খুলুন{" "}
              <a
                className="text-blue-600 underline"
                href="https://openrouter.ai"
                target="_blank"
                rel="noreferrer"
              >
                openrouter.ai
              </a>
            </li>
            <li>Dashboard → Keys/Api Keys এ যান</li>
            <li>New Key তৈরি করুন</li>
            <li>Key কপি করুন</li>
            <li>নিচের বক্সে paste করে “Done” চাপুন</li>
          </ol>

          <div className="mt-4">
            <div className="text-sm font-medium text-gray-800 mb-2">Video tutorial</div>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-black/5">
              {/* NOTE: তুমি চাইলে এখানে নিজের ভিডিও বসাবে */}
              <iframe
                className="w-full h-full"
                src={VIDEO_EMBED_URL}
                title="OpenRouter API Key Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              (ভিডিও না থাকলে: VIDEO_EMBED_URL এ তোমার ভিডিও ID বসাবে)
            </p>
          </div>
        </div>

        {/* Key input */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-800">Paste your OpenRouter API key</label>
          <textarea
            className="mt-2 w-full h-28 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Paste your OpenRouter API key here..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="flex-1 h-11 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50"
              type="button"
            >
              Done
            </button>
            <button
              onClick={handleClear}
              className="h-11 px-4 rounded-xl bg-gray-200 text-gray-900 font-semibold"
              type="button"
            >
              Clear
            </button>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="mt-3 text-sm text-gray-600 underline"
            type="button"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeySetup;
