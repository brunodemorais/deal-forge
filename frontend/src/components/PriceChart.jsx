import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const formatDate = date =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const PriceChart = ({ data, currentPrice, className = '' }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // Add padding so flat / extreme data doesn’t collapse visually
    const padding = (maxPrice - minPrice) * 0.1 || 1;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const range = adjustedMax - adjustedMin;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - ((d.price - adjustedMin) / range) * 100,
      price: d.price,
      date: d.date,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaD = `${pathD} L 100 100 L 0 100 Z`;

    return {
      points,
      pathD,
      areaD,
      minPrice,
      maxPrice,
      startDate: data[0].date,
      endDate: data[data.length - 1].date,
    };
  }, [data]);

  if (!chartData) return null;

  const handleMouseMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    const closest = chartData.points.reduce((prev, curr) =>
      Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
    );

    setHoveredPoint(closest);
  };

  return (
    <div className={`bg-[#2a2a2f] rounded-lg p-6 border border-[#3a3a3f] ${className}`}>
      <div className="flex justify-between mb-3 text-sm text-gray-400">
        <span>Price History</span>
        <span>Current: ${currentPrice?.toFixed(2)}</span>
      </div>

      <div className="relative h-64 w-full">
        {/* Y-axis context */}
        <div className="absolute left-0 top-0 text-xs text-gray-500">
          ${chartData.maxPrice.toFixed(2)}
        </div>
        <div className="absolute left-0 bottom-0 text-xs text-gray-500">
          ${chartData.minPrice.toFixed(2)}
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <motion.path
            d={chartData.areaD}
            fill="url(#priceGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.path
            d={chartData.pathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />

          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1="0"
                y2="100"
                stroke="#f97316"
                strokeDasharray="1.5"
                opacity="0.25"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="1.8"
                fill="#f97316"
              />
            </>
          )}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none shadow-lg"
            style={{
              left: `${hoveredPoint.x}%`,
              top: `${hoveredPoint.y}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="font-semibold">
              ${hoveredPoint.price.toFixed(2)}
            </div>
            <div className="text-gray-400">
              {formatDate(hoveredPoint.date)}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-400">
        <span>{formatDate(chartData.startDate)}</span>
        <span>{formatDate(chartData.endDate)}</span>
      </div>
    </div>
  );
};

export default PriceChart;
