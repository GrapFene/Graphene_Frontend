import { Flame, TrendingUp, Clock, Star } from 'lucide-react';

/**
 * Filter Bar Component
 * 
 * Functionality: Displays a list of filters (Hot, Trending, New, Top) for posts.
 * Input: None
 * Response: JSX.Element - The rendered filter bar.
 */
export default function FilterBar() {
  const filters = [
    { icon: Flame, label: 'Hot', color: 'bg-red-400' },
    { icon: TrendingUp, label: 'Trending', color: 'bg-orange-400' },
    { icon: Clock, label: 'New', color: 'bg-blue-400' },
    { icon: Star, label: 'Top', color: 'bg-yellow-300' },
  ];

  return (
    <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] mb-6 transition-colors duration-200">
      <div className="flex gap-2 p-4 overflow-x-auto">
        {filters.map((filter, index) => (
          <button
            key={filter.label}
            className={`flex items-center gap-2 ${index === 0 ? filter.color : 'bg-white dark:bg-black text-black dark:text-white'
              } border-3 border-black dark:border-gray-700 px-4 py-2 font-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(50,50,50,1)] whitespace-nowrap`}
          >
            <filter.icon className="w-5 h-5" strokeWidth={3} />
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
