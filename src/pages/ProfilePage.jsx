import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Bookmark, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                })
              }
              className="gap-2 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f]"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-6 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-gray-400 text-sm">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-white">Account Settings</h2>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f]"
              onClick={() =>
                toast({
                  title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                })
              }
            >
              <Bell className="w-5 h-5" />
              Notification Preferences
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f]"
              onClick={() =>
                toast({
                  title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                })
              }
            >
              <Settings className="w-5 h-5" />
              Account Settings
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-[#1a1a1f] border-[#3a3a3f] hover:bg-[#2a2a2f] text-red-400 hover:text-red-300"
              onClick={handleSignOut}
            >
              <User className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ProfilePage;