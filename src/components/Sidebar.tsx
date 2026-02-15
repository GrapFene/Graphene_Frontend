import { useEffect, useState } from 'react';
import { TrendingUp, Users, Flame } from 'lucide-react';
import { getTopCommunities, Community, getSubscribedCommunities, joinCommunity, leaveCommunity } from '../services/api';

import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from './Spinner';

interface SidebarProps {
  onLogout: () => void;
  onProfileClick: () => void;
}

export default function Sidebar({ onLogout, onProfileClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [communities, subs] = await Promise.all([
        getTopCommunities(5),
        getSubscribedCommunities()
      ]);
      setTopCommunities(communities);
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to fetch sidebar data', error);
    }
  };

  const handleJoinLeave = async (e: React.MouseEvent, communityName: string) => {
    e.stopPropagation(); // Prevent navigation to community page

    setLoadingCommunities(prev => ({ ...prev, [communityName]: true }));

    try {
      if (subscriptions.includes(communityName)) {
        await leaveCommunity(communityName);
        setSubscriptions(prev => prev.filter(s => s !== communityName));
      } else {
        await joinCommunity(communityName);
        setSubscriptions(prev => [...prev, communityName]);
      }
    } catch (error) {
      console.error('Failed to update subscription', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setLoadingCommunities(prev => ({ ...prev, [communityName]: false }));
    }
  };

  return (
    <aside className="space-y-6">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] transition-colors duration-200">
        <div className="bg-gradient-to-r from-cyan-400 to-pink-400 border-b-4 border-black dark:border-gray-800 p-4 transition-colors duration-200">
          <h3 className="font-black text-xl flex items-center gap-2 text-black dark:text-white">
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
              <span className="font-black text-2xl text-gray-300 dark:text-gray-600">
                {index + 1}
              </span>
              <div>
                <p className="font-black hover:underline cursor-pointer text-black dark:text-white dark:hover:text-cyan-400">
                  {trend.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                  {trend.count} posts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] transition-colors duration-200">
        <div className="bg-yellow-300 dark:bg-fuchsia-600 border-b-4 border-black dark:border-gray-800 p-4 transition-colors duration-200">
          <h3 className="font-black text-xl flex items-center gap-2 text-black dark:text-white">
            <TrendingUp className="w-6 h-6" strokeWidth={3} />
            Top Communities
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {topCommunities.map((community) => (
            <div
              key={community.name}
              className={`flex items-center justify-between p-2 -mx-2 cursor-pointer transition-colors duration-200 border-2 ${location.pathname === `/r/${community.name}`
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-black dark:border-purple-500' // Active state
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-black dark:hover:border-gray-700'
                }`}
              onClick={() => navigate(`/r/${community.name}`)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-3 border-black dark:border-gray-700 flex items-center justify-center font-black bg-purple-400 transition-colors duration-200"
                >
                  {community.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-black dark:text-white">g/{community.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(community.members || community.subscriber_count || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                disabled={loadingCommunities[community.name]}
                className={`px-3 py-1 font-bold text-sm transition-colors flex items-center gap-2 ${subscriptions.includes(community.name)
                    ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                    : 'bg-black dark:bg-gray-700 text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                  } ${loadingCommunities[community.name] ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={(e) => handleJoinLeave(e, community.name)}
              >
                {loadingCommunities[community.name] ? (
                  <>
                    <Spinner className="w-3 h-3" />
                    <span className="hidden sm:inline">Wait...</span>
                  </>
                ) : (
                  subscriptions.includes(community.name) ? 'Leave' : 'Join'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-lime-300 dark:bg-emerald-600 border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] p-6 transition-colors duration-200">
        <h3 className="font-black text-xl mb-3 text-black dark:text-white">About GrapFene</h3>
        <p className="font-medium mb-4 leading-relaxed text-black dark:text-white">
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
          className="w-full bg-black text-white px-4 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] border-4 border-black dark:border-gray-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
