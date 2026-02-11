import { useState } from 'react';
import { Search, Plus, Bell, User, Users } from 'lucide-react';

interface HeaderProps {
  onCreatePost?: () => void;
  onCreateCommunity?: () => void;
}

export default function Header({ onCreatePost, onCreateCommunity }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent | React.FormEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !searchQuery.trim()) return;
    e.preventDefault();
    // Use window.location as Header is sometimes used outside Router context in preview, 
    // but here we are in App. Use href to force refresh or just navigation? 
    // Better to use prop or hook if inside router. 
    // Assuming inside Router as it's used in Pages. 
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <header className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black tracking-tight cursor-pointer" onClick={() => window.location.href = '/'}>
              <span className="bg-black text-white px-3 py-1">GrapFene</span>
            </h1>

            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-80 px-4 py-2 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreatePost}
              className="hidden sm:flex items-center gap-2 bg-yellow-300 border-4 border-black px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus className="w-5 h-5" />
              <span>Post</span>
            </button>

            <button
              onClick={onCreateCommunity}
              className="hidden sm:flex items-center gap-2 bg-pink-300 border-4 border-black px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Users className="w-5 h-5" />
              <span>Community</span>
            </button>

            <button className="bg-white border-4 border-black p-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Bell className="w-5 h-5" />
            </button>

            <button className="bg-lime-400 border-4 border-black p-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
