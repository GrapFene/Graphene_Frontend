import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import {
    getCommunityDetails,
    getPostsByCommunity,
    getPostsFromPeer,
    Post as ApiPost,
    joinCommunity,
    leaveCommunity,
    blockCommunity,
    unblockCommunity,
    getSubscribedCommunities,
    getBlockedCommunities
} from '../services/api';

/**
 * Community Page Component
 *
 * For local communities  → fetches posts from the main API.
 * For federated communities (home_instance_domain set) → fetches posts
 * directly from the peer server's public API and shows a federation badge.
 */
export default function CommunityPage() {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [homeInstanceDomain, setHomeInstanceDomain] = useState<string | null>(null);
    const [peerError, setPeerError] = useState<string | null>(null);

    useEffect(() => {
        if (name) {
            loadCommunityAndPosts(name);
            checkSubscriptionAndBlockStatus(name);
        }
    }, [name]);

    const checkSubscriptionAndBlockStatus = async (communityName: string) => {
        try {
            const [subs, blocks] = await Promise.all([
                getSubscribedCommunities(),
                getBlockedCommunities()
            ]);
            setIsSubscribed(subs.includes(communityName));
            setIsBlocked(blocks.includes(communityName));
        } catch (error) {
            console.error("Failed to check status", error);
        }
    };

    /**
     * 1. Fetch community metadata (to know if it's federated and where).
     * 2. If federated → hit the peer server directly.
     *    If local     → hit the main API as usual.
     */
    const loadCommunityAndPosts = async (communityName: string) => {
        setLoading(true);
        setPeerError(null);

        try {
            // Step 1: get community details (local DB always has a stub even for federated ones)
            let peerDomain: string | null = null;
            try {
                const community = await getCommunityDetails(communityName);
                peerDomain = community.is_federated && community.home_instance_domain
                    ? community.home_instance_domain
                    : null;
                setHomeInstanceDomain(peerDomain);
            } catch {
                // Community might not exist yet or DB call failed — fall back to local
                setHomeInstanceDomain(null);
            }

            // Step 2: fetch posts from the right place
            let rawPosts: ApiPost[];
            if (peerDomain) {
                rawPosts = await getPostsFromPeer(peerDomain, communityName);
            } else {
                rawPosts = await getPostsByCommunity(communityName);
            }

            const mapped = rawPosts.map((p: ApiPost) => ({
                id: p.id,
                community: p.subreddit,
                author: p.author_did.substring(0, 15) + '...',
                timestamp: new Date(p.created_at).toLocaleString(),
                title: (p as any).title || 'Untitled Post',
                content: p.content,
                votes: p.score || 0,
                commentCount: p.comment_count || 0,
                imageUrl: p.media_url || null,
                mediaType: p.media_type,
                source_instance_url: p.source_instance_url ?? peerDomain ?? null,
                is_verified: p.is_verified ?? (peerDomain ? true : false),
                user_vote: p.user_vote ?? null,
                peer_domain: p.peer_domain ?? peerDomain ?? null,
                is_federated_post: !!(p.peer_domain ?? peerDomain),
            }));
            setPosts(mapped);
        } catch (err: any) {
            console.error("Failed to fetch community posts", err);
            setPeerError(err.message ?? 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLeave = async () => {
        if (!name) return;
        try {
            if (isSubscribed) {
                await leaveCommunity(name);
                setIsSubscribed(false);
            } else {
                await joinCommunity(name);
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error("Failed to update subscription", error);
        }
    };

    const handleBlockUnblock = async () => {
        if (!name) return;
        try {
            if (isBlocked) {
                await unblockCommunity(name);
                setIsBlocked(false);
            } else {
                if (window.confirm(`Are you sure you want to block g/${name}?`)) {
                    await blockCommunity(name);
                    setIsBlocked(true);
                }
            }
        } catch (error) {
            console.error("Failed to update block status", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        localStorage.removeItem('graphene_user');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <Header
                onCreatePost={() => navigate('/submit')}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Community header */}
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] mb-6 transition-colors flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-black mb-1 text-black dark:text-white">g/{name}</h1>
                                {/* Federation badge */}
                                {homeInstanceDomain && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Globe className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            Hosted on <span className="font-mono">{homeInstanceDomain}</span>
                                        </span>
                                    </div>
                                )}
                                {!homeInstanceDomain && (
                                    <p className="font-bold text-gray-600 dark:text-gray-300">Community posts</p>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleJoinLeave}
                                    className={`px-6 py-2 font-black border-4 border-black dark:border-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${isSubscribed
                                        ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
                                        : 'bg-green-400 dark:bg-green-600 text-black dark:text-white'
                                    }`}
                                >
                                    {isSubscribed ? 'Joined' : 'Join'}
                                </button>
                                <button
                                    onClick={handleBlockUnblock}
                                    className={`px-6 py-2 font-black border-4 border-black dark:border-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${isBlocked
                                        ? 'bg-red-400 dark:bg-red-700 text-black dark:text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-red-100 dark:hover:bg-red-900'
                                    }`}
                                >
                                    {isBlocked ? 'Blocked' : 'Block'}
                                </button>
                            </div>
                        </div>

                        {/* Peer fetch error */}
                        {peerError && (
                            <div className="bg-red-50 dark:bg-red-950 border-4 border-red-500 p-4">
                                <p className="font-black text-red-700 dark:text-red-300">
                                    ⚠️ Could not reach peer server{homeInstanceDomain ? ` (${homeInstanceDomain})` : ''}: {peerError}
                                </p>
                                <p className="font-bold text-red-600 dark:text-red-400 text-sm mt-1">
                                    The community's host server may be offline. Try again later.
                                </p>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white py-12">Loading community posts...</div>
                        ) : posts.length === 0 && !peerError ? (
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-colors">
                                <p className="font-black text-2xl mb-4 text-black dark:text-white">No posts here yet!</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="bg-yellow-300 dark:bg-yellow-600 border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
                                >
                                    Be the first to post
                                </button>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))
                        )}
                    </div>

                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <Sidebar
                                onLogout={handleLogout}
                                onProfileClick={() => navigate('/profile')}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
