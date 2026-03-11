import { useEffect, useState } from 'react';
import { TrendingUp, Users, Globe } from 'lucide-react';
import {
  getTopCommunities,
  getTopCommunitiesFromPeer,
  getActivePeers,
  Community,
  getSubscribedCommunities,
  joinCommunity,
  leaveCommunity,
} from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
  onProfileClick: () => void;
}

/**
 * Sidebar Component
 *
 * Shows top communities from this instance AND all active peer instances.
 * Peer communities show a 🌐 badge and link to their community page.
 */
export default function Sidebar({ onLogout, onProfileClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingCommunities(true);
    try {
      // Fetch local communities + subscriptions in parallel
      const [localCommunities, subs, peers] = await Promise.all([
        getTopCommunities(10),
        getSubscribedCommunities(),
        getActivePeers(),
      ]);
      setSubscriptions(subs);

      // Fetch top communities from each active peer in parallel
      const peerCommunityArrays = await Promise.allSettled(
        peers.map((p: { domain: string }) => getTopCommunitiesFromPeer(p.domain, 5))
      );

      const peerCommunities = peerCommunityArrays
        .filter((r): r is PromiseFulfilledResult<Community[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // Merge: local first, then peer (deduplicate by name+domain combo)
      const seen = new Set<string>();
      const merged: Community[] = [];
      for (const c of [...localCommunities, ...peerCommunities]) {
        const key = `${c.peer_domain ?? 'local'}:${c.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            ...c,
            members: c.subscriber_count ?? c.members ?? 0,
          });
        }
      }

      // Sort by member count descending
      merged.sort((a, b) => (b.members ?? 0) - (a.members ?? 0));
      setTopCommunities(merged);
    } catch (error) {
      console.error('Failed to fetch sidebar data', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleJoinLeave = async (e: React.MouseEvent, community: Community) => {
    e.stopPropagation();
    try {
      if (subscriptions.includes(community.name)) {
        await leaveCommunity(community.name);
        setSubscriptions(prev => prev.filter(s => s !== community.name));
      } else {
        await joinCommunity(community.name);
        setSubscriptions(prev => [...prev, community.name]);
      }
    } catch (error) {
      console.error('Failed to update subscription', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  const handleCommunityClick = (community: Community) => {
    if (community.peer_domain) {
      // Navigate to community page — CommunityPage will detect is_federated
      navigate(`/r/${community.name}?peer=${community.peer_domain}`);
    } else {
      navigate(`/r/${community.name}`);
    }
  };

  const communityColors = [
    'bg-purple-400', 'bg-pink-400', 'bg-yellow-300', 'bg-cyan-400',
    'bg-green-400', 'bg-red-400', 'bg-orange-400', 'bg-blue-400',
  ];

  return (
    <aside className="space-y-6">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] transition-colors duration-200">
        <div className="bg-yellow-300 dark:bg-fuchsia-600 border-b-4 border-black dark:border-gray-800 p-4 transition-colors duration-200">
          <h3 className="font-black text-xl flex items-center gap-2 text-black dark:text-white">
            <TrendingUp className="w-6 h-6" strokeWidth={3} />
            Top Communities
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {loadingCommunities ? (
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading...</p>
          ) : topCommunities.length === 0 ? (
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No communities yet</p>
          ) : (
            topCommunities.map((community, idx) => {
              const isPeer = !!community.peer_domain;
              const isActive = location.pathname === `/r/${community.name}`;
              const avatarColor = communityColors[idx % communityColors.length];

              return (
                <div
                  key={`${community.peer_domain ?? 'local'}-${community.name}`}
                  className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 p-2 -mx-2 cursor-pointer transition-colors duration-200 border-2 ${
                    isActive
                      ? 'bg-yellow-100 dark:bg-gray-800 border-black dark:border-gray-600'
                      : 'border-transparent hover:border-black dark:hover:border-gray-700'
                  }`}
                  onClick={() => handleCommunityClick(community)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 border-3 border-black dark:border-gray-700 flex items-center justify-center font-black ${avatarColor} shrink-0`}>
                      {isPeer ? <Globe className="w-5 h-5" strokeWidth={3} /> : community.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-black dark:text-white truncate">
                        g/{community.name}
                        {isPeer && (
                          <span className="ml-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
                            🌐
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        {(community.members ?? 0).toLocaleString()}
                        {isPeer && (
                          <span className="truncate">{community.peer_domain}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    className={`ml-2 shrink-0 px-3 py-1 font-bold text-sm transition-colors ${
                      subscriptions.includes(community.name)
                        ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                        : 'bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                    }`}
                    onClick={(e) => handleJoinLeave(e, community)}
                  >
                    {subscriptions.includes(community.name) ? 'Leave' : 'Join'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-lime-300 dark:bg-emerald-600 border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] p-6 transition-colors duration-200">
        <button
          onClick={() => navigate('/messages')}
          className="w-full bg-pink-400 dark:bg-pink-600 text-black dark:text-white border-4 border-black dark:border-gray-700 px-4 py-3 font-black mb-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          Messages
        </button>

        <h3 className="font-black text-xl mb-3 text-black dark:text-white">About Graphene</h3>
        <p className="font-medium mb-4 leading-relaxed text-black dark:text-white">
          The brutally honest social platform. No algorithms, no BS. Just pure,
          unfiltered discussions.
        </p>
        <button
          onClick={() => navigate('/about')}
          className="w-full bg-cyan-400 dark:bg-cyan-600 text-black dark:text-white border-4 border-black dark:border-gray-700 px-4 py-3 font-black mb-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          Learn More
        </button>
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
