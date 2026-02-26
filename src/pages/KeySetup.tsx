import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserApiKey, setUserApiKey, clearUserApiKey } from "../utils/storage";

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
    navigate("/chat"); // তোমার app এ chat route যদি অন্য হয় পরে ঠিক করবো
  };

  const handleClear = () => {
    clearUserApiKey();
    setKey("");
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-200 p-5">
        <h1 className="text-xl font-bold text-gray-900">Add your API Key</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your key is saved only on your device (localStorage). It is not stored on our server.
        </p>

        <textarea
          className="mt-4 w-full h-32 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Paste your OpenRouter API key here..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50"
            disabled={!key.trim()}
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
  );
};

export default KeySetup;
