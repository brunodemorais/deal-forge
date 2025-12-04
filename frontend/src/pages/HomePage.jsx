import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import GameCard from '@/components/GameCard';
import { apiClient } from '@/lib/api/client';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    discountMin: 0,
    priceMin: 0,
    priceMax: 100,
    releaseYear: null,
  });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 24,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.discountMin, filters.priceMin, filters.priceMax, filters.releaseYear]);

  // Fetch games when page or filters change
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          search: searchQuery || undefined,
          discountMin: filters.discountMin,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          page: currentPage,
          perPage: 24,
        };
        
        const response = await apiClient.getGames(params);
        
        let fetchedGames = response.games || response;
        const paginationData = response.pagination;
        
        // Apply release year filter on frontend if needed
        if (filters.releaseYear) {
          fetchedGames = fetchedGames.filter(game => {
            if (!game.release_date) return false;
            const gameYear = new Date(game.release_date).getFullYear();
            return gameYear === filters.releaseYear;
          });
        }
        
        setGames(fetchedGames);
        
        if (paginationData) {
          setPagination(paginationData);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
        setError(err.message || 'Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [searchQuery, filters.discountMin, filters.priceMin, filters.priceMax, filters.releaseYear, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topDeals = games
    .filter(game => game.discount_percent > 0)
    .sort((a, b) => b.discount_percent - a.discount_percent)
    .slice(0, 6);

  const filteredGames = games;

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(pagination.page - 1)}
        disabled={!pagination.hasPrev}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      
      <div className="flex items-center gap-2">
        {/* First page */}
        {pagination.page > 3 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              1
            </button>
            {pagination.page > 4 && (
              <span className="text-gray-400 px-2">...</span>
            )}
          </>
        )}
        
        {/* Pages around current page */}
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
          .filter(page => {
            return page === pagination.page || 
                   page === pagination.page - 1 || 
                   page === pagination.page + 1 ||
                   (page === pagination.page - 2 && pagination.page <= 3) ||
                   (page === pagination.page + 2 && pagination.page >= pagination.totalPages - 2);
          })
          .map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                page === pagination.page
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        
        {/* Last page */}
        {pagination.page < pagination.totalPages - 2 && (
          <>
            {pagination.page < pagination.totalPages - 3 && (
              <span className="text-gray-400 px-2">...</span>
            )}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
      </div>
      
      <button
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={!pagination.hasNext}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>DealForge - Track Steam Game Prices & Find the Best Deals</title>
        <meta name="description" content="Discover the best Steam game deals with DealForge. Track prices, get alerts, and never miss a sale on your favorite PC games." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Find the Best{' '}
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Steam Deals
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Track prices, discover deals, and never overpay for games again
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <SearchBar onSearch={setSearchQuery} onFilterChange={setFilters} />
          </div>
        </motion.section>

        {!searchQuery && !loading && currentPage === 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Top Deals Today</h2>
            </div>

            {topDeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No deals available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topDeals.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: searchQuery ? 0 : 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {searchQuery ? 'Search Results' : 'All Games'}
            </h2>
            {!loading && (
              <span className="text-gray-400">
                ({pagination.totalItems} {pagination.totalItems === 1 ? 'game' : 'games'})
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Loading games...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Error loading games</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No games found matching your criteria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </div>
              
              {pagination.totalPages > 1 && <PaginationControls />}
            </>
          )}
        </motion.section>
      </div>
    </>
  );
};

export default HomePage;