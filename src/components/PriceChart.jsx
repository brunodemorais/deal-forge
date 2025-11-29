import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const PriceChart = ({ data, currentPrice, className = '' }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((point.price - minPrice) / priceRange) * 100;
      return { x, y, price: point.price, date: point.date };
    });

    const pathD = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const areaD = `${pathD} L 100 100 L 0 100 Z`;

    return { points, pathD, areaD, minPrice, maxPrice };
  }, [data]);

  if (!chartData) {
    return (
      <div className={`bg-[#2a2a2f] rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#3a3a3f] rounded w-1/3"></div>
          <div className="h-48 bg-[#3a3a3f] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#2a2a2f] rounded-lg p-6 border border-[#3a3a3f] ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Price History (90 Days)</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-400">Current: ${currentPrice?.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-400">Low: ${chartData.minPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <motion.path
            d={chartData.areaD}
            fill="url(#priceGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          <motion.path
            d={chartData.pathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />

          {chartData.points.map((point, index) => {
            if (index % 10 !== 0 && index !== chartData.points.length - 1) return null;
            return (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1"
                fill="#f97316"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.3 }}
                className="hover:r-2 cursor-pointer transition-all"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-l border-b border-[#3a3a3f] opacity-30"></div>
        </div>
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-400">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default PriceChart;