import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Bookmark, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

// CHANGED: Import from new custom AuthContext
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage = () => {
  // CHANGED: Destructure 'logout' instead of 'signOut'
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSignOut = () => {
    logout(); // CHANGED: Call logout()
    navigate('/');
  };

  // Mock stats (you may integrate fetching these from a protected backend endpoint later)
  const stats = [
    { label: 'Games Tracked', value: '2', icon: Bookmark },
    { label: 'Active Alerts', value: '2', icon: Bell },
    { label: 'Saved This Month', value: '$45', icon: Calendar },
  ];

  return (
    <>
      <Helmet>
        <title>My Profile | DealForge</title>
        <meta name="description" content="Manage your DealForge profile, view your watchlist statistics, and update your settings." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-orange-500/20 text-orange-500 text-3xl">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold text-white">{user.email}</h1>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                {/* Assuming your Flask /auth/me returns 'created_at' */}
                {user.created_at && (
                    <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-4 text-center space-y-2"
            >
              <stat.icon className="w-6 h-6 text-orange-500 mx-auto" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-white">Account Actions</h2>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f] text-gray-300"
              onClick={() =>
                toast({
                  title: "Notification preferences coming soon",
                  description: "This feature will be available in a future update.",
                })
              }
            >
              <Bell className="w-5 h-5" />
              Notification Preferences
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f] text-gray-300"
              onClick={() =>
                toast({
                  title: "Account settings coming soon",
                  description: "This feature will be available in a future update.",
                })
              }
            >
              <Settings className="w-5 h-5" />
              Change Password / Account Settings
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f] text-red-400 hover:text-red-300"
              onClick={handleSignOut}
            >
              <User className="w-5 h-5" />
              **Sign Out**
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ProfilePage;