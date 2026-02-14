import { useState, useEffect } from 'react';
import { Search, Plus, Bell, User, Users, Moon, Sun } from 'lucide-react';
import { getProfile } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onCreatePost?: () => void;
  onCreateCommunity?: () => void;
}

export default function Header({ onCreatePost, onCreateCommunity }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      const userStr = localStorage.getItem('graphene_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const result = await getProfile(user.did);
          if (result && result.content && result.content.avatarUrl) {
            setAvatarUrl(result.content.avatarUrl);
          }
        } catch (error) {
          console.error("Failed to fetch profile for header", error);
        }
      }
    };

    fetchProfile();

    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('profileUpdate', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdate', handleProfileUpdate);
  }, []);

  const handleSearch = (e: React.KeyboardEvent | React.FormEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !searchQuery.trim()) return;
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b-4 border-black dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black tracking-tight cursor-pointer" onClick={() => window.location.href = '/'}>
              <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 transition-colors duration-200">GrapFene</span>
            </h1>

            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-80 px-4 py-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
              />
              <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-black dark:text-white" /> : <Sun className="w-5 h-5 text-black dark:text-white" />}
            </button>
            <button
              onClick={onCreatePost}
              className="hidden sm:flex items-center gap-2 bg-yellow-300 dark:bg-yellow-600 border-4 border-black dark:border-gray-700 px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Post</span>
            </button>

            <button
              onClick={onCreateCommunity}
              className="hidden sm:flex items-center gap-2 bg-pink-300 dark:bg-pink-600 border-4 border-black dark:border-gray-700 px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
            >
              <Users className="w-5 h-5" />
              <span>Community</span>
            </button>

            <button className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-700 p-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white">
              <Bell className="w-5 h-5" />
            </button>

            <button onClick={() => window.location.href = '/profile'} className="bg-lime-400 dark:bg-lime-700 border-4 border-black dark:border-gray-700 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white overflow-hidden relative w-12 h-12 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full px-4 py-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
            />
            <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
