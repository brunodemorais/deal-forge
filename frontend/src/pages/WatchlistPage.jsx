import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bookmark, ArrowUpDown, Tag, Trash2, Loader2, DollarSign } from 'lucide-react'; // Added DollarSign, Loader2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// CHANGED: Import from new AuthContext
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client'; // Now includes JWT logic
import GameCard from '@/components/GameCard'; // Assuming you use GameCard for results

const WatchlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // ADDED: State for watchlist data and loading status
  const [watchlistGames, setWatchlistGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGames, setSelectedGames] = useState([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);

  // ADDED: Fetch logic wrapped in useCallback
  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlistGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getWatchlist();
      
      // Crucial fix: Safely extract the array. Assuming backend returns {games: [...]}.
      // If it's just an array, it uses 'data'. Otherwise, it uses 'data.games'.
      const games = data.games || data; 
      
      setWatchlistGames(Array.isArray(games) ? games : []); // Default to empty array
    } catch (err) {
      setError(err.message || "Failed to load watchlist.");
      setWatchlistGames([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ADDED: useEffect to call the fetch function on load/user change
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]); 

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  // Memoized function for sorting
  // The crash is fixed here because watchlistGames is now guaranteed to be an array
  const sortedGames = useMemo(() => {
    // Safety check for stability
    let games = Array.isArray(watchlistGames) ? [...watchlistGames] : []; 
    
    // Apply filters
    games = games.filter(game => {
      // Apply discount filter
      if (filterDiscountOnly && (game.discount_percent || 0) <= 0) {
        return false;
      }
      
      // Tag filtering logic (not implemented, but placeholder for structure)
      // if (filterTags.length > 0 && !filterTags.some(tag => game.tags?.includes(tag))) {
      //   return false;
      // }
      
      return true;
    });

    // Apply sorting
    games.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          // Assuming final_price is the current price
          compareValue = (a.final_price || 0) - (b.final_price || 0); 
          break;
        case 'discount':
          compareValue = (a.discount_percent || 0) - (b.discount_percent || 0);
          break;
        case 'added_at':
          // Assuming the date is sortable string/object
          compareValue = new Date(a.added_at) - new Date(b.added_at);
          break;
        default:
          compareValue = 0;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    return games;
  }, [watchlistGames, sortBy, sortOrder]);


  // Logic for selecting games
  const handleSelectGame = (gameId, isChecked) => {
    if (isChecked) {
      setSelectedGames((prev) => [...prev, gameId]);
    } else {
      setSelectedGames((prev) => prev.filter((id) => id !== gameId));
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedGames(watchlistGames.map((game) => game.app_id));
    } else {
      setSelectedGames([]);
    }
  };

  // NEW: Implementation for removing selected games
  const handleRemoveSelected = async () => {
    if (selectedGames.length === 0) return;
    
    setLoading(true);
    let successCount = 0;
    
    // Use Promise.all to send requests concurrently
    const removalPromises = selectedGames.map(appId => 
      apiClient.removeFromWatchlist(appId)
        .then(() => { successCount++; })
        .catch(error => {
            console.error(`Failed to remove game ${appId}:`, error);
            // Optionally toast individual errors, but we'll show a summary
        })
    );
    
    await Promise.all(removalPromises);
    
    // Refresh the watchlist after all removal attempts
    await fetchWatchlist();
    setSelectedGames([]);
    
    toast({
        title: "Watchlist Updated",
        description: `${successCount} game(s) removed successfully.`,
      });
  };

  if (!user) {
    // Will be handled by the useEffect redirect, but helps prevent flashes
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-gray-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading...
      </div>
    );
  }
  
  // The rest of the render logic remains similar, but now handles loading/error states

  return (
    <>
      <Helmet>
        <title>My Watchlist | DealForge</title>
        <meta name="description" content="Manage your saved games and track price alerts." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
        >
          <div className="flex items-center space-x-3">
            <Bookmark className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">My Watchlist ({watchlistGames.length})</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="bg-[#1a1a1f] border-[#3a3a3f] text-gray-300 hover:bg-[#2a2a2f]"
              onClick={() => setShowTagDialog(true)}
            >
              <Tag className="w-4 h-4 mr-2" />
              Manage Tags
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={selectedGames.length === 0}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Selected ({selectedGames.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#2a2a2f] border-[#3a3a3f]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Remove Selected Games?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to remove {selectedGames.length} game(s) from your watchlist? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#1a1a1f] border-[#3a3a3f] text-gray-300 hover:bg-[#2a2a2f]">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveSelected(selectedGames)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.header>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Loading your watchlist...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-400 text-lg mb-2">Error loading watchlist</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && watchlistGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-[#2a2a2f] border border-[#3a3a3f] rounded-lg space-y-4"
          >
            <Bookmark className="w-12 h-12 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Your Watchlist is Empty</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Start tracking games by searching for them on the home page and clicking the bookmark icon.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Start Tracking Games
            </Button>
          </motion.div>
        )}

        {/* Display Watchlist */}
        {!loading && sortedGames.length > 0 && (
          <div className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#3a3a3f]">
                <thead className="bg-[#1a1a1f]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                      <Checkbox
                        checked={selectedGames.length === sortedGames.length && sortedGames.length > 0}
                        onCheckedChange={(checked) => {
                          setSelectedGames(
                            checked ? sortedGames.map((g) => g.app_id) : []
                          );
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto"
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Game
                        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortBy === 'name' ? 'text-orange-500' : ''}`} />
                      </Button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto"
                        onClick={() => {
                          setSortBy('discount');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Discount
                        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortBy === 'discount' ? 'text-orange-500' : ''}`} />
                      </Button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto"
                        onClick={() => {
                          setSortBy('price');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Price
                        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortBy === 'price' ? 'text-orange-500' : ''}`} />
                      </Button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto"
                        onClick={() => {
                          setSortBy('added_at');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Date Added
                        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortBy === 'added_at' ? 'text-orange-500' : ''}`} />
                      </Button>
                    </th>
                    <th className="relative px-6 py-3 w-32">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3a3f]">
                  {sortedGames.map((game) => (
                    <motion.tr
                      key={game.app_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#1a1a1f] transition-colors"
                    >
                      <td className="px-4 py-4 w-10">
                        <Checkbox
                          checked={selectedGames.includes(game.app_id)}
                            onCheckedChange={(isChecked) => handleSelectGame(game.app_id, isChecked)}
                            className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/game/${game.app_id}`)}
                          className="text-white font-semibold hover:text-orange-500 transition-colors text-left"
                        >
                            {game.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          game.discount_percent > 0
                            ? 'bg-green-100/10 text-green-400'
                            : 'bg-gray-100/10 text-gray-400'
                        }`}>
                          -{game.discount_percent}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-semibold">
                          <DollarSign className="w-4 h-4 inline mr-1 text-green-400" />
                          {game.final_price/100?.toFixed(2) || 'N/A'}
                        </div>
                        {game.discount_percent > 0 && (
                          <div className="text-xs text-gray-500 line-through">
                             <DollarSign className="w-3 h-3 inline mr-1" />
                            {game.initial_price/100?.toFixed(2) || 'N/A'}
                          </div>
                          
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                        {game.added_at ? new Date(game.added_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                            {/* ... existing Tag and Remove buttons */}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* ... Dialogs (keep at the bottom) */}
    </>
  );
};

export default WatchlistPage;