import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type DiscoverTab = 'for-you' | 'bangladesh';

type DiscoverCard = {
  id: string;
  tab: DiscoverTab;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  timeAgo: string;
  category: string;
};

const demoCards: DiscoverCard[] = [
  {
    id: '1',
    tab: 'for-you',
    title: 'AI tools are changing how students learn online',
    summary:
      'New AI-powered study tools are helping students summarize lessons, solve problems, and learn faster with personalized explanations.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop',
    source: 'Tech Daily',
    timeAgo: '12m ago',
    category: 'AI & Tech',
  },
  {
    id: '2',
    tab: 'for-you',
    title: 'Entertainment platforms push short videos even harder',
    summary:
      'Short-form video continues to dominate social platforms as creators, brands, and apps compete for user attention.',
    imageUrl:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&auto=format&fit=crop',
    source: 'Media Pulse',
    timeAgo: '34m ago',
    category: 'Entertainment',
  },
  {
    id: '3',
    tab: 'bangladesh',
    title: 'বাংলাদেশে প্রযুক্তি খাতে নতুন সুযোগ বাড়ছে',
    summary:
      'স্থানীয় স্টার্টআপ, AI টুলস এবং ডিজিটাল সার্ভিসের চাহিদা বাড়ায় তরুণদের জন্য নতুন কাজের সুযোগ তৈরি হচ্ছে।',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop',
    source: 'Bangladesh Tech',
    timeAgo: '1h ago',
    category: 'বাংলাদেশ',
  },
  {
    id: '4',
    tab: 'bangladesh',
    title: 'ঢাকায় তরুণদের মধ্যে AI শেখার আগ্রহ বাড়ছে',
    summary:
      'স্কুল-কলেজের শিক্ষার্থীরা এখন পড়াশোনা, কনটেন্ট তৈরি এবং অ্যাপ ডেভেলপমেন্টে AI ব্যবহার করতে আগ্রহী হচ্ছে।',
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop',
    source: 'Dhaka Update',
    timeAgo: '2h ago',
    category: 'Education',
  },
];

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('for-you');

  const visibleCards = demoCards.filter((card) => card.tab === activeTab);

  return (
    <div className="min-h-screen bg-[#fbfbf7] text-[#10202b]">
      <div className="sticky top-0 z-20 bg-[#fbfbf7]/95 backdrop-blur-xl px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="h-12 w-12 rounded-full bg-white shadow-[0_4px_18px_rgba(15,23,42,0.08)] flex items-center justify-center text-[24px]"
          >
            ←
          </button>

          <h1 className="text-[30px] font-bold tracking-[-0.04em]">
            Discover
          </h1>

          <button
            type="button"
            className="h-12 w-12 rounded-full bg-white shadow-[0_4px_18px_rgba(15,23,42,0.08)] flex items-center justify-center text-[22px]"
          >
            🔖
          </button>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('for-you')}
            className={`px-6 py-3 rounded-full text-[16px] font-semibold whitespace-nowrap transition ${
              activeTab === 'for-you'
                ? 'bg-[#dff3f0] text-[#0f766e]'
                : 'bg-white text-[#25323b]'
            }`}
          >
            For You
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bangladesh')}
            className={`px-6 py-3 rounded-full text-[16px] font-semibold whitespace-nowrap transition ${
              activeTab === 'bangladesh'
                ? 'bg-[#dff3f0] text-[#0f766e]'
                : 'bg-white text-[#25323b]'
            }`}
          >
            Bangladesh
          </button>
        </div>
      </div>

      <div className="px-5 pb-10 space-y-7">
        {visibleCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => alert('Details page later: ' + card.title)}
            className="w-full text-left rounded-[30px] overflow-hidden bg-[#167f9f] text-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] active:scale-[0.985] transition"
          >
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full h-[285px] object-cover"
              loading="lazy"
            />

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-medium text-white/85">
                  {card.source} • {card.timeAgo}
                </span>

                <span className="text-[12px] px-3 py-1 rounded-full bg-white/15 text-white/90">
                  {card.category}
                </span>
              </div>

              <h2 className="text-[29px] leading-[1.12] font-bold tracking-[-0.04em] mb-4">
                {card.title}
              </h2>

              <p className="text-[17px] leading-[1.55] text-white/88">
                {card.summary}
              </p>

              <div className="mt-7 flex items-center justify-between">
                <span className="text-[14px] text-white/80">
                  Tap to read details
                </span>

                <span className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center text-[22px]">
                  🔖
                </span>
              </div>
            </div>
          </button>
        ))}

        <div className="py-6 text-center text-[14px] text-gray-400">
          Scroll korle ekhane next cached cards load hobe...
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
