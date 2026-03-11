import { Flame, TrendingUp, Clock, Star } from 'lucide-react';

export type FeedFilter = 'hot' | 'trending' | 'new' | 'top';

interface FilterBarProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

/**
 * Filter Bar Component
 *
 * Displays Hot / Trending / New / Top filter buttons.
 * Hot    = score × recency decay (Wilson score-like)
 * Trending = rising fast (high score-to-age ratio)
 * New    = newest first
 * Top    = highest score
 */
export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters: { key: FeedFilter; icon: typeof Flame; label: string; color: string }[] = [
    { key: 'hot',      icon: Flame,      label: 'Hot',      color: 'bg-red-400' },
    { key: 'trending', icon: TrendingUp, label: 'Trending', color: 'bg-orange-400' },
    { key: 'new',      icon: Clock,      label: 'New',      color: 'bg-blue-400' },
    { key: 'top',      icon: Star,       label: 'Top',      color: 'bg-yellow-300' },
  ];

  return (
    <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] mb-6 transition-colors duration-200">
      <div className="flex gap-2 p-4 overflow-x-auto">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`flex items-center gap-2 border-3 border-black dark:border-gray-700 px-4 py-2 font-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all whitespace-nowrap
                ${isActive
                  ? `${filter.color} shadow-none translate-x-0.5 translate-y-0.5 text-black`
                  : 'bg-white dark:bg-black text-black dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(50,50,50,1)] hover:shadow-none'
                }`}
            >
              <filter.icon className="w-5 h-5" strokeWidth={3} />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
