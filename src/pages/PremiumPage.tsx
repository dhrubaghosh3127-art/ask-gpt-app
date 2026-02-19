import React from 'react';
import { Link } from 'react-router-dom';

const PremiumPage: React.FC = () => {
  return (
    <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <Link to="/chat" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
            ← Back to Chat
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Go Pro Free</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic (Active)</h2>
              <p className="text-gray-500 mt-1">Free forever</p>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">$0 <span className="text-lg font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                ✅ Gemini 3 Flash Model
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                ✅ Basic Chat History
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                ✅ Standard Speed
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                ✅ Multi-language support
              </li>
            </ul>
            <button disabled className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl font-semibold">
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="relative border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-8 flex flex-col space-y-6">
            <div className="absolute -top-4 right-8 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
              RECOMMENDED
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pro Ultra</h2>
              <p className="text-gray-500 mt-1">For advanced users</p>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">$19 <span className="text-lg font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                ✨ Gemini 3 Pro (Full Reasoning)
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                ✨ 5x Higher Message Limits
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                ✨ Early access to new features
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                ✨ Advanced Vision (OCR + Image Help)
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                ✨ Priority Support
              </li>
            </ul>
            <button onClick={() => alert('Premium is currently locked in v1 Preview.')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all">
              Upgrade Now
            </button>
          </div>
        </div>

        <div className="mt-16 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Why ASK-GPT Pro?</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our Pro plan unlocks the full potential of Google's Gemini 3 Pro model, providing superior reasoning for complex coding tasks, detailed scientific explanations, and creative writing that sounds more human than ever.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
                
