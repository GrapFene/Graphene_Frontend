import { Search, Plus, Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-black text-white px-3 py-1">GrapFene</span>
            </h1>

            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-80 px-4 py-2 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 bg-yellow-300 border-4 border-black px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Plus className="w-5 h-5" />
              <span>Create</span>
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
