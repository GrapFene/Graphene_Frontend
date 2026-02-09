import { Flame, TrendingUp, Clock, Star } from 'lucide-react';

export default function FilterBar() {
  const filters = [
    { icon: Flame, label: 'Hot', color: 'bg-red-400' },
    { icon: TrendingUp, label: 'Trending', color: 'bg-orange-400' },
    { icon: Clock, label: 'New', color: 'bg-blue-400' },
    { icon: Star, label: 'Top', color: 'bg-yellow-300' },
  ];

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
      <div className="flex gap-2 p-4 overflow-x-auto">
        {filters.map((filter, index) => (
          <button
            key={filter.label}
            className={`flex items-center gap-2 ${
              index === 0 ? filter.color : 'bg-white'
            } border-3 border-black px-4 py-2 font-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap`}
          >
            <filter.icon className="w-5 h-5" strokeWidth={3} />
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
