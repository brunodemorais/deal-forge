import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const GameCard = ({ game, onWatchlistToggle, isInWatchlist }) => {
  const { toast } = useToast();

  const handleWatchlistClick = (e) => {
    e.preventDefault();
    if (onWatchlistToggle) {
      onWatchlistToggle(game);
    } else {
      toast({
        title: "Watchlist feature coming soon",
        description: "This feature will be available in a future update.",
      });
    }
  };

  const getPriceGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'text-green-400',
      'A': 'text-green-400',
      'B+': 'text-lime-400',
      'B': 'text-lime-400',
      'C+': 'text-yellow-400',
      'C': 'text-yellow-400',
      'D': 'text-orange-400',
      'F': 'text-red-400'
    };
    return gradeColors[grade] || 'text-gray-400';
  };

  const getForecastIcon = (forecast) => {
    switch (forecast) {
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link to={`/game/${game.id}`}>
        <div className="bg-[#2a2a2f] rounded-lg overflow-hidden border border-[#3a3a3f] hover:border-orange-500/50 transition-all duration-300">
          <div className="relative aspect-video overflow-hidden">
            <img
              src={game.header_image}
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {game.discount_percent > 0 && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-sm font-bold">
                -{game.discount_percent}%
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-2 right-2 bg-[#1a1a1f]/80 backdrop-blur-sm hover:bg-[#1a1a1f] ${
                isInWatchlist ? 'text-orange-500' : 'text-gray-400'
              }`}
              onClick={handleWatchlistClick}
            >
              <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-white text-lg line-clamp-1 group-hover:text-orange-500 transition-colors">
              {game.name}
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {game.current_price === 0 ? (
                  <div className="text-lg font-bold text-green-400">Free</div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">
                        ${game.current_price.toFixed(2)}
                      </span>
                      {game.discount_percent > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          ${game.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Historical Low: ${game.historical_low.toFixed(2)}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className={`text-2xl font-bold ${getPriceGradeColor(game.price_grade)}`}>
                  {game.price_grade}
                </div>
                <div className="flex items-center gap-1">
                  {getForecastIcon(game.forecast)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {game.genres?.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-1 bg-[#3a3a3f] text-gray-300 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default GameCard;