import { useEffect, useState } from 'react';
import { TrendingUp, Users, Flame } from 'lucide-react';
import { getTopCommunities, Community } from '../services/api';

interface SidebarProps {
  onLogout: () => void;
  onProfileClick: () => void;
}

export default function Sidebar({ onLogout, onProfileClick }: SidebarProps) {
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);

  useEffect(() => {
    fetchTopCommunities();
  }, []);

  const fetchTopCommunities = async () => {
    try {
      const data = await getTopCommunities(5);
      setTopCommunities(data);
    } catch (error) {
      console.error('Failed to fetch top communities', error);
    }
  };

  return (
    <aside className="space-y-6">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-gradient-to-r from-cyan-400 to-pink-400 border-b-4 border-black p-4">
          <h3 className="font-black text-xl flex items-center gap-2">
            <Flame className="w-6 h-6" strokeWidth={3} />
            Trending Today
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {[
            { title: 'Neobrutalism is back', count: '12.5k' },
            { title: 'New framework drama', count: '8.9k' },
            { title: 'Designer quits tech', count: '7.2k' },
            { title: 'AI takes over again', count: '15.3k' },
          ].map((trend, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="font-black text-2xl text-gray-300">
                {index + 1}
              </span>
              <div>
                <p className="font-black hover:underline cursor-pointer">
                  {trend.title}
                </p>
                <p className="text-sm text-gray-600 font-bold">
                  {trend.count} posts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-yellow-300 border-b-4 border-black p-4">
          <h3 className="font-black text-xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" strokeWidth={3} />
            Top Communities
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {topCommunities.map((community) => (
            <div
              key={community.name}
              className="flex items-center justify-between hover:bg-gray-50 p-2 -mx-2 cursor-pointer"
              onClick={() => window.location.href = `/r/${community.name}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-3 border-black flex items-center justify-center font-black bg-purple-400"
                >
                  {community.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black">g/{community.name}</p>
                  <p className="text-sm text-gray-600 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(community.members || community.subscriber_count || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="bg-black text-white px-3 py-1 font-bold text-sm hover:bg-gray-800 transition-colors">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-lime-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 className="font-black text-xl mb-3">About GrapFene</h3>
        <p className="font-medium mb-4 leading-relaxed">
          The brutally honest social platform. No algorithms, no BS. Just pure,
          unfiltered discussions.
        </p>
        <button
          onClick={onProfileClick}
          className="w-full bg-white text-black border-4 border-black px-4 py-3 font-black mb-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          My Profile
        </button>
        <button
          onClick={onLogout}
          className="w-full bg-black text-white border-4 border-black px-4 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
