import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
// CHANGED: Import from new AuthContext
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import HomePage from '@/pages/HomePage';
import GameDetailPage from '@/pages/GameDetailPage';
import WatchlistPage from '@/pages/WatchlistPage';
import DailyDealsPage from '@/pages/DailyDealsPage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Helmet>
          <title>DealForge - Steam Price Tracker</title>
          <meta name="description" content="Track Steam game prices, discover deals, and never miss a price drop with DealForge - your ultimate Steam price tracking companion." />
        </Helmet>
        <div className="min-h-screen bg-[#1a1a1f]">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GameDetailPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/deals" element={<DailyDealsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;