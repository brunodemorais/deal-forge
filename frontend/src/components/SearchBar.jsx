import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBar = ({ onSearch, onFilterChange, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    discountMin: 0,
    priceMin: 0,
    priceMax: 100,
    releaseYear: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, onSearch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      discountMin: 0,
      priceMin: 0,
      priceMax: 100,
      releaseYear: null,
    };
    setFilters(defaultFilters);
    if (onFilterChange) {
      onFilterChange(defaultFilters);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => {
      if (index === 0) return value > 0;
      if (index === 1) return value > 0;
      if (index === 2) return value < 100;
      if (index === 3) return value !== null;
      return false;
    }
  ).length;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 bg-[#2a2a2f] border-[#3a3a3f] text-white placeholder:text-gray-400 focus:border-orange-500"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-12 gap-2 bg-[#2a2a2f] border-[#3a3a3f] hover:bg-[#3a3a3f] hover:border-orange-500 relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2a2a2f] border-[#3a3a3f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Filter Games</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Minimum Discount (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[filters.discountMin]}
                    onValueChange={([value]) => handleFilterChange('discountMin', value)}
                    max={90}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-orange-500 font-bold w-12 text-right">
                    {filters.discountMin}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range ($)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[filters.priceMin, filters.priceMax]}
                      onValueChange={([min, max]) => {
                        handleFilterChange('priceMin', min);
                        handleFilterChange('priceMax', max);
                      }}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>${filters.priceMin}</span>
                    <span>${filters.priceMax}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="releaseYear" className="text-sm font-medium">
                  Release Year
                </Label>
                <Input
                  id="releaseYear"
                  type="number"
                  placeholder="e.g. 2023"
                  value={filters.releaseYear || ''}
                  onChange={(e) =>
                    handleFilterChange('releaseYear', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="bg-[#1a1a1f] border-[#3a3a3f] text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-[#3a3a3f] hover:bg-[#3a3a3f]"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SearchBar;