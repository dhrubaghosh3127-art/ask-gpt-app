import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type DiscoverTab = 'forYou' | 'bangladesh';

type DiscoverCard = {
  id: string;
  tab: DiscoverTab;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  timeAgo: string;
  category: string;
  theme: string;
};

const demoCards: DiscoverCard[] = [
  {
    id: '1',
    tab: 'forYou',
    title: 'Apple to hold iPhone 18 Pro prices steady despite rising costs',
    summary:
      'Apple is expected to keep premium iPhone pricing stable while memory and component costs continue to increase globally.',
    imageUrl:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop',
    source: 'Tech Brief',
    timeAgo: '12m ago',
    category: 'Tech',
    theme: 'from-[#4a2430] to-[#1f1016]',
  },
  {
    id: '2',
    tab: 'forYou',
    title: 'AI tools are becoming the new daily assistant for students',
    summary:
      'Students are using AI to summarize lessons, solve problems, write notes, and learn complex topics faster with step-by-step help.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop',
    source: 'AI Weekly',
    timeAgo: '35m ago',
    category: 'AI',
    theme: 'from-[#16384b] to-[#0f1d2a]',
  },
  {
    id: '3',
    tab: 'bangladesh',
    title: 'বাংলাদেশে তরুণদের মধ্যে AI শেখার আগ্রহ দ্রুত বাড়ছে',
    summary:
      'পড়াশোনা, কনটেন্ট তৈরি, অ্যাপ ডেভেলপমেন্ট এবং অনলাইন কাজের জন্য তরুণরা এখন AI টুল ব্যবহার করতে বেশি আগ্রহী।',
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop',
    source: 'Dhaka Update',
    timeAgo: '1h ago',
    category: 'বাংলাদেশ',
    theme: 'from-[#244235] to-[#10251d]',
  },
  {
    id: '4',
    tab: 'bangladesh',
    title: 'ঢাকায় প্রযুক্তি ও স্টার্টআপ খাতে নতুন সুযোগ তৈরি হচ্ছে',
    summary:
      'ডিজিটাল সার্ভিস, AI অ্যাপ এবং লোকাল টেক প্ল্যাটফর্মের চাহিদা বাড়ায় তরুণ উদ্যোক্তাদের জন্য নতুন সম্ভাবনা তৈরি হচ্ছে।',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop',
    source: 'Bangladesh Tech',
    timeAgo: '2h ago',
    category: 'Tech BD',
    theme: 'from-[#2b4b64] to-[#142536]',
  },
];

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('forYou');
  const [liked, setLiked] = useState(false);

  const cards = demoCards.filter((card) => card.tab === activeTab);

  return (
    <div className="min-h-screen bg-[#fbfbf7] text-[#10202b]">
      <div className="sticky top-0 z-30 bg-[#fbfbf7]/95 backdrop-blur-xl px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/chat')}
            aria-label="Back"
            className="h-12 w-12 rounded-full bg-white shadow-[0_4px_18px_rgba(15,23,42,0.08)] flex items-center justify-center active:scale-[0.96] transition-transform"
          >
            <svg
              className="h-6 w-6 text-[#12333b]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h1 className="text-[30px] font-bold tracking-[-0.04em] text-[#12333b]">
            Discover
          </h1>

          <button
            type="button"
            onClick={() => setLiked((value) => !value)}
            aria-label="Love Discover"
            className="h-12 w-12 rounded-full bg-white shadow-[0_4px_18px_rgba(15,23,42,0.08)] flex items-center justify-center active:scale-[0.96] transition-transform"
          >
            <svg
              className={`h-7 w-7 transition-colors ${
                liked ? 'text-red-500' : 'text-[#12333b]'
              }`}
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
            </svg>
          </button>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveTab('forYou')}
            className={`px-6 py-3 rounded-full text-[16px] font-semibold whitespace-nowrap transition ${
              activeTab === 'forYou'
                ? 'bg-[#dff3f0] text-[#0f766e] shadow-sm'
                : 'bg-white text-[#25323b] shadow-sm'
            }`}
          >
            For You
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bangladesh')}
            className={`px-6 py-3 rounded-full text-[16px] font-semibold whitespace-nowrap transition ${
              activeTab === 'bangladesh'
                ? 'bg-[#dff3f0] text-[#0f766e] shadow-sm'
                : 'bg-white text-[#25323b] shadow-sm'
            }`}
          >
            Bangladesh
          </button>
        </div>
      </div>

      <main className="px-5 pb-12 space-y-7">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              alert('Details page UI next step: ' + card.title);
            }}
            className={`w-full text-left rounded-[30px] overflow-hidden bg-gradient-to-b ${card.theme} text-white shadow-[0_14px_35px_rgba(15,23,42,0.16)] active:scale-[0.985] transition-transform`}
          >
            <div className="p-[14px]">
              <img
                src={card.imageUrl}
                alt={card.title}
                loading="lazy"
                className="h-[300px] w-full rounded-[22px] object-cover"
              />
            </div>

            <div className="px-6 pb-6 pt-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-[13px]">
                    📰
                  </div>
                  <span className="truncate text-[14px] font-medium text-white/82">
                    {card.source}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-white/78">
                  <span className="text-[13px]">{card.timeAgo}</span>
                </div>
              </div>

              <h2 className="text-[28px] leading-[1.13] font-bold tracking-[-0.045em] mb-4">
                {card.title}
              </h2>

              <p className="text-[17px] leading-[1.55] text-white/78 line-clamp-4">
                {card.summary}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="rounded-full bg-white/14 px-3 py-1.5 text-[13px] text-white/86">
                  {card.category}
                </span>

                <span className="text-[14px] text-white/72">
                  Tap to read
                </span>
              </div>
            </div>
          </button>
        ))}

        <div className="py-5 text-center text-[14px] text-[#8a9399]">
          Scroll করলে এখানে cache থেকে আরও cards আসবে...
        </div>
      </main>
    </div>
  );
};

export default DiscoverPage;
