import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Trophy, Calendar } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { mockGames } from '@/lib/mockData';

const DailyDealsPage = () => {
  const historicalLows = mockGames
    .filter(g => g.current_price === g.historical_low && g.current_price > 0)
    .slice(0, 4);

  const largestDrops = mockGames
    .filter(g => g.discount_percent > 0)
    .sort((a, b) => b.discount_percent - a.discount_percent)
    .slice(0, 4);

  const trendingGames = mockGames
    .filter(g => g.discount_percent > 30)
    .slice(0, 4);

  const sections = [
    {
      title: 'New Historical Lows',
      icon: Trophy,
      description: 'Games at their lowest price ever',
      games: historicalLows,
      color: 'text-green-400',
    },
    {
      title: 'Largest Price Drops',
      icon: TrendingDown,
      description: 'Biggest discounts available today',
      games: largestDrops,
      color: 'text-orange-400',
    },
    {
      title: 'Trending Deals',
      icon: Zap,
      description: 'Most popular deals right now',
      games: trendingGames,
      color: 'text-blue-400',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Daily Deals - Best Steam Discounts Today | DealForge</title>
        <meta name="description" content="Discover today's best Steam deals, historical lows, and trending discounts. Updated daily with the hottest game prices." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Today's Best Deals
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Handpicked deals updated daily - don't miss out on these limited-time offers
          </p>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </motion.div>

        {sections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a2a2f] rounded-lg border border-[#3a3a3f]">
                  <Icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  <p className="text-sm text-gray-400">{section.description}</p>
                </div>
              </div>

              {section.games.length === 0 ? (
                <div className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-12 text-center">
                  <p className="text-gray-400">No deals available in this category right now</p>
                  <p className="text-sm text-gray-500 mt-2">Check back later for new deals!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {section.games.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIndex * 0.1 + index * 0.05 }}
                    >
                      <GameCard game={game} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-8 text-center space-y-4"
        >
          <Zap className="w-12 h-12 text-orange-500 mx-auto" />
          <h3 className="text-2xl font-bold text-white">Never Miss a Deal</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Add games to your watchlist and get instant notifications when they hit your target price
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default DailyDealsPage;