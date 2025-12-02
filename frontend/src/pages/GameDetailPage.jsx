import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Users,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriceChart from '@/components/PriceChart';
import { mockGames, generatePriceHistory, mockRetailers } from '@/lib/mockData';
import { useToast } from '@/components/ui/use-toast';

const GameDetailPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const game = useMemo(() => {
    return mockGames.find(g => g.id === gameId);
  }, [gameId]);

  const priceHistory = useMemo(() => {
    if (!game) return [];
    return generatePriceHistory(game.id, game.current_price, game.historical_low);
  }, [game]);

  const retailers = useMemo(() => {
    if (!game) return mockRetailers;
    return mockRetailers.map((retailer, index) => {
      if (index === 0) {
        return { ...retailer, price: game.current_price, discount: game.discount_percent };
      }
      const variance = (Math.random() - 0.5) * 10;
      const price = Math.max(0, game.current_price + variance);
      const discount = Math.floor((1 - price / game.original_price) * 100);
      return { ...retailer, price, discount };
    });
  }, [game]);

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Game not found</h2>
          <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const getPriceGradeColor = (grade) => {
    const colors = {
      'A+': 'text-green-400',
      'A': 'text-green-400',
      'B+': 'text-lime-400',
      'B': 'text-lime-400',
      'C+': 'text-yellow-400',
      'C': 'text-yellow-400',
      'D': 'text-orange-400',
      'F': 'text-red-400',
    };
    return colors[grade] || 'text-gray-400';
  };

  const getForecastIndicator = () => {
    switch (game.forecast) {
      case 'falling':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <TrendingDown className="w-5 h-5" />
            <span>Price Expected to Fall</span>
          </div>
        );
      case 'rising':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <TrendingUp className="w-5 h-5" />
            <span>Price Expected to Rise</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <Minus className="w-5 h-5" />
            <span>Price Stable</span>
          </div>
        );
    }
  };

  const handleWatchlistToggle = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>{game.name} - Price Tracker | DealForge</title>
        <meta
          name="description"
          content={`Track ${game.name} prices on Steam. Current price: $${game.current_price}. Historical low: $${game.historical_low}. Get price alerts and never miss a deal.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#2a2a2f] rounded-lg overflow-hidden border border-[#3a3a3f]">
              <img
                src={game.header_image}
                alt={game.name}
                className="w-full aspect-video object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{game.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    {game.genres?.map(genre => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-[#3a3a3f] text-gray-300 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleWatchlistToggle}
                  className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Bookmark className="w-5 h-5" />
                  Add to Watchlist
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#2a2a2f] rounded-lg p-4 border border-[#3a3a3f]">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Release Date
                  </div>
                  <div className="text-white font-semibold">
                    {new Date(game.release_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-[#2a2a2f] rounded-lg p-4 border border-[#3a3a3f]">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    Developer
                  </div>
                  <div className="text-white font-semibold line-clamp-1">
                    {game.developers?.[0] || 'Unknown'}
                  </div>
                </div>
                <div className="bg-[#2a2a2f] rounded-lg p-4 border border-[#3a3a3f]">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Tag className="w-4 h-4" />
                    Publisher
                  </div>
                  <div className="text-white font-semibold line-clamp-1">
                    {game.publishers?.[0] || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            <PriceChart data={priceHistory} currentPrice={game.current_price} />

            <div className="bg-[#2a2a2f] rounded-lg p-6 border border-[#3a3a3f] space-y-4">
              <h3 className="text-xl font-bold text-white">Retailer Comparison</h3>
              <div className="space-y-3">
                {retailers.map((retailer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#1a1a1f] rounded-lg hover:bg-[#2a2a2f] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-white font-semibold">{retailer.name}</span>
                      {retailer.discount > 0 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-sm rounded font-bold">
                          -{retailer.discount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {retailer.price !== null ? (
                        <span className="text-xl font-bold text-white">
                          ${retailer.price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-orange-500 hover:text-orange-400"
                        onClick={() =>
                          toast({
                            title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                          })
                        }
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#2a2a2f] rounded-lg p-6 border border-[#3a3a3f] space-y-6">
              <div className="text-center space-y-2">
                <div className="text-sm text-gray-400">Current Price</div>
                {game.current_price === 0 ? (
                  <div className="text-4xl font-bold text-green-400">Free to Play</div>
                ) : (
                  <>
                    <div className="text-5xl font-bold text-white">
                      ${game.current_price.toFixed(2)}
                    </div>
                    {game.discount_percent > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 line-through">
                          ${game.original_price.toFixed(2)}
                        </span>
                        <span className="px-3 py-1 bg-orange-500 text-white rounded font-bold">
                          -{game.discount_percent}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-[#3a3a3f]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price Grade</span>
                  <span className={`text-3xl font-bold ${getPriceGradeColor(game.price_grade)}`}>
                    {game.price_grade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Historical Low</span>
                  <span className="text-white font-bold">${game.historical_low.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Savings from Low</span>
                  <span
                    className={
                      game.current_price <= game.historical_low
                        ? 'text-green-400 font-bold'
                        : 'text-red-400 font-bold'
                    }
                  >
                    {game.current_price <= game.historical_low
                      ? 'Best Price!'
                      : `+$${(game.current_price - game.historical_low).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#3a3a3f]">
                <div className="text-sm text-gray-400 mb-2">Price Forecast</div>
                {getForecastIndicator()}
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                onClick={() =>
                  toast({
                    title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                  })
                }
              >
                <ExternalLink className="w-5 h-5" />
                View on Steam
              </Button>
            </div>

            <div className="bg-[#2a2a2f] rounded-lg p-6 border border-[#3a3a3f] space-y-4">
              <h3 className="font-bold text-white">Platform Availability</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Windows</span>
                  <span className={game.platforms?.windows ? 'text-green-400' : 'text-gray-600'}>
                    {game.platforms?.windows ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">macOS</span>
                  <span className={game.platforms?.mac ? 'text-green-400' : 'text-gray-600'}>
                    {game.platforms?.mac ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Linux</span>
                  <span className={game.platforms?.linux ? 'text-green-400' : 'text-gray-600'}>
                    {game.platforms?.linux ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default GameDetailPage;