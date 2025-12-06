import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bookmark, ArrowUpDown, Tag, Trash2, Loader2 } from 'lucide-react';
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

const WatchlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGames, setSelectedGames] = useState([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // NEW: State for fetching real data
  const [watchlistGames, setWatchlistGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch the watchlist from the Flask backend
  const fetchWatchlist = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      // Calls the protected Flask endpoint /api/watchlist
      const data = await apiClient.getWatchlist(); 
      // Assuming your Flask backend returns an array of game objects
      setWatchlistGames(data);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      toast({
        title: "Error",
        description: error.message || "Could not load watchlist. Please try again.",
        variant: "destructive",
      });
      setWatchlistGames([]); 
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial fetch when the component mounts or user state changes
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);


  // Placeholder for toggling sort direction
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Memoized function for sorting
  const sortedGames = useMemo(() => {
    let games = [...watchlistGames];
    games.sort((a, b) => {
      let compareValue = 0;
      // Assuming your watchlist items have these properties from the backend
      switch (sortBy) {
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          compareValue = (a.current_price || 0) - (b.current_price || 0);
          break;
        case 'discount':
          compareValue = (a.discount_percent || 0) - (b.discount_percent || 0);
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
  
  const handleTagSelected = () => {
    // This feature is still coming soon, as per your snippet
    toast({
        title: "Tagging feature coming soon",
        description: "This feature will be available in a future update.",
    });
    setShowTagDialog(false);
  };

  // Redirect if not logged in
  if (!user && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4">
          <Bookmark className="w-16 h-16 text-gray-600 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Sign in to view your watchlist</h2>
          <p className="text-gray-400">Track your favorite games and get price alerts</p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>My Watchlist | DealForge</title>
        <meta name="description" content="Manage your game watchlist." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Bookmark className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
              <p className="text-gray-400">{watchlistGames.length} games tracked</p>
            </div>
          </div>
          
          {watchlistGames.length > 0 && (
            <div className="flex items-center space-x-2">
                {selectedGames.length > 0 && (
                    <>
                        <Button
                            variant="outline"
                            className="bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f] text-gray-300 gap-2"
                            onClick={() => setShowTagDialog(true)}
                        >
                            <Tag className="w-4 h-4" />
                            Tag ({selectedGames.length})
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-600 text-white gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove ({selectedGames.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#2a2a2f] border-[#3a3a3f] text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                        This will permanently remove {selectedGames.length} game(s) from your watchlist.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#1a1a1f] border-[#3a3a3f] text-gray-300 hover:bg-[#2a2a2f]">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleRemoveSelected}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Remove
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </div>
          )}
        </div>

        {/* Dialog for Tagging - Kept as placeholder */}
        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogContent className="bg-[#2a2a2f] border-[#3a3a3f] text-white">
            <DialogHeader>
              <DialogTitle>Apply Tag to {selectedGames.length} Games</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label htmlFor="new-tag">Tag Name</Label>
              <Input
                id="new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., RPG, Horror, Must Buy"
                className="bg-[#1a1a1f] border-[#3a3a3f]"
              />
              <Button onClick={handleTagSelected} className="w-full bg-orange-500 hover:bg-orange-600">
                Apply Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
            <div className="text-center text-gray-400 py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                <p>Loading watchlist...</p>
            </div>
        ) : watchlistGames.length === 0 ? (
          <div className="text-center py-16 bg-[#2a2a2f] rounded-lg border border-[#3a3a3f]">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-4">Start tracking games to get price alerts</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Browse Games
            </Button>
          </div>
        ) : (
          <div className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1f] border-b border-[#3a3a3f]">
                  <tr>
                    <th className="px-4 py-3 w-10 text-left">
                       <Checkbox 
                            checked={selectedGames.length === watchlistGames.length}
                            onCheckedChange={handleSelectAll}
                            className="w-4 h-4 rounded"
                        />
                    </th>
                    <th 
                        className="px-4 py-3 text-left cursor-pointer"
                        onClick={() => toggleSort('name')}
                    >
                        <div className="flex items-center text-gray-300">
                            Game 
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                        </div>
                    </th>
                    <th 
                        className="px-4 py-3 text-right cursor-pointer w-32"
                        onClick={() => toggleSort('price')}
                    >
                        <div className="flex items-center justify-end text-gray-300">
                            Price 
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                        </div>
                    </th>
                    <th 
                        className="px-4 py-3 text-right cursor-pointer w-24"
                        onClick={() => toggleSort('discount')}
                    >
                        <div className="flex items-center justify-end text-gray-300">
                            Discount 
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                        </div>
                    </th>
                    <th className="px-4 py-3 text-center w-24 text-gray-300">Grade</th>
                    <th className="px-4 py-3 text-center w-32 text-gray-300">Actions</th>
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
                      <td className="px-4 py-4 text-right text-white font-bold w-32">
                        ${(game.current_price / 100 || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right w-24">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {game.discount_percent}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center w-24">
                        <span className="text-sm font-bold text-orange-400">
                          {game.price_grade || 'B'} {/* Use the grade from your Flask logic */}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center w-32">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTagDialog(true)} // Opens dialog to tag just this one
                            className="text-gray-400 hover:text-white"
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#2a2a2f] border-[#3a3a3f] text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remove from Watchlist?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                        Are you sure you want to remove {game.name} from your watchlist?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#1a1a1f] border-[#3a3a3f] text-gray-300 hover:bg-[#2a2a2f]">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleRemoveSelected([game.app_id])} // Remove only this game
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Remove
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </>
  );
};

export default WatchlistPage;