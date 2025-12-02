import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bookmark, ArrowUpDown, Tag, Trash2 } from 'lucide-react';
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
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const WatchlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGames, setSelectedGames] = useState([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');

  const mockWatchlistGames = [
    {
      id: '1',
      name: 'Cyberpunk 2077',
      current_price: 29.99,
      target_price: 19.99,
      historical_low: 24.99,
      discount_percent: 50,
      tags: ['RPG', 'Wishlist'],
    },
    {
      id: '2',
      name: 'Elden Ring',
      current_price: 47.99,
      target_price: 39.99,
      historical_low: 39.99,
      discount_percent: 20,
      tags: ['Action'],
    },
  ];

  const sortedGames = useMemo(() => {
    let games = [...mockWatchlistGames];
    games.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'price':
          compareValue = a.current_price - b.current_price;
          break;
        case 'discount':
          compareValue = a.discount_percent - b.discount_percent;
          break;
        default:
          compareValue = 0;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    return games;
  }, [sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedGames(sortedGames.map(g => g.id));
    } else {
      setSelectedGames([]);
    }
  };

  const handleSelectGame = (gameId, checked) => {
    if (checked) {
      setSelectedGames([...selectedGames, gameId]);
    } else {
      setSelectedGames(selectedGames.filter(id => id !== gameId));
    }
  };

  const handleBulkTag = () => {
    if (selectedGames.length === 0) {
      toast({
        title: 'No games selected',
        description: 'Please select at least one game to tag',
        variant: 'destructive',
      });
      return;
    }
    setShowTagDialog(true);
  };

  const applyTag = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
    setShowTagDialog(false);
    setNewTag('');
  };

  if (!user) {
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
        <meta name="description" content="Manage your game watchlist, set price alerts, and track your favorite Steam games on DealForge." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Bookmark className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
              <p className="text-gray-400">{sortedGames.length} games tracked</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkTag}
              disabled={selectedGames.length === 0}
              className="gap-2 bg-[#2a2a2f] border-[#3a3a3f] hover:bg-[#3a3a3f]"
            >
              <Tag className="w-4 h-4" />
              Tag Selected ({selectedGames.length})
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedGames.length === 0}
                  className="gap-2 bg-[#2a2a2f] border-[#3a3a3f] hover:bg-[#3a3a3f] text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#2a2a2f] border-[#3a3a3f]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Remove from watchlist?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will remove {selectedGames.length} game(s) from your watchlist. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() =>
                      toast({
                        title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                      })
                    }
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogContent className="bg-[#2a2a2f] border-[#3a3a3f] text-white">
            <DialogHeader>
              <DialogTitle>Add Tag to Selected Games</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newTag">Tag Name</Label>
                <Input
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., Must Buy, Favorites"
                  className="bg-[#1a1a1f] border-[#3a3a3f]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#3a3a3f] hover:bg-[#3a3a3f]"
                  onClick={() => {
                    setShowTagDialog(false);
                    setNewTag('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={applyTag}
                  disabled={!newTag.trim()}
                >
                  Apply Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {sortedGames.length === 0 ? (
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
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedGames.length === sortedGames.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('name')}
                        className="gap-2 text-gray-400 hover:text-white"
                      >
                        Game
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('price')}
                        className="gap-2 text-gray-400 hover:text-white"
                      >
                        Current Price
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Target Price</th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('discount')}
                        className="gap-2 text-gray-400 hover:text-white"
                      >
                        Discount
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Tags</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3a3f]">
                  {sortedGames.map((game) => (
                    <motion.tr
                      key={game.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#1a1a1f] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedGames.includes(game.id)}
                          onCheckedChange={(checked) => handleSelectGame(game.id, checked)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/game/${game.id}`)}
                          className="text-white font-semibold hover:text-orange-500 transition-colors text-left"
                        >
                          {game.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-white font-bold">
                        ${game.current_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            game.current_price <= game.target_price
                              ? 'text-green-400 font-semibold'
                              : 'text-gray-400'
                          }
                        >
                          ${game.target_price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {game.discount_percent > 0 ? (
                          <span className="px-2 py-1 bg-orange-500 text-white rounded text-sm font-bold">
                            -{game.discount_percent}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {game.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-[#3a3a3f] text-gray-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                              })
                            }
                            className="text-gray-400 hover:text-white"
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                              })
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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