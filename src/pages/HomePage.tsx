import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import FilterBar, { FeedFilter } from '../components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { getFeed, Post as ApiPost } from '../services/api';

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

/** Age of post in hours */
const ageHours = (createdAt: string) =>
    (Date.now() - new Date(createdAt).getTime()) / 3_600_000;

/**
 * Hot score — Reddit-style: sign(score) × log10(max(|score|,1)) + age decay.
 * Recent posts with moderate votes beat old posts with high votes.
 */
const hotScore = (votes: number, createdAt: string) => {
    const order = Math.log10(Math.max(Math.abs(votes), 1));
    const sign = votes > 0 ? 1 : votes < 0 ? -1 : 0;
    const seconds = (new Date(createdAt).getTime() - new Date('2024-01-01').getTime()) / 1000;
    return sign * order + seconds / 45000;
};

/**
 * Trending score — votes per hour since posted (velocity).
 * Posts gaining votes fast rank highest regardless of total age.
 */
const trendingScore = (votes: number, createdAt: string) => {
    const hours = Math.max(ageHours(createdAt), 0.1);
    return votes / hours;
};

const sortPosts = (posts: any[], filter: FeedFilter): any[] => {
    const sorted = [...posts];
    switch (filter) {
        case 'hot':
            return sorted.sort((a, b) => hotScore(b.votes, b.timestamp) - hotScore(a.votes, a.timestamp));
        case 'trending':
            return sorted.sort((a, b) => trendingScore(b.votes, b.created_at ?? b.timestamp) - trendingScore(a.votes, a.created_at ?? a.timestamp));
        case 'new':
            return sorted.sort((a, b) =>
                new Date(b.created_at ?? b.timestamp).getTime() - new Date(a.created_at ?? a.timestamp).getTime()
            );
        case 'top':
            return sorted.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
        default:
            return sorted;
    }
};

/**
 * Home Page Component
 *
 * Displays the federated feed (main + peer posts) with Hot/Trending/New/Top filtering.
 */
export default function HomePage() {
    const navigate = useNavigate();
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('hot');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Backend already merges local + peer posts in GET /posts
            const data = await getFeed('recent');
            const mappedPosts = data.map((p: ApiPost) => ({
                id: p.id,
                community: p.subreddit || 'general',
                author: p.author_did.substring(0, 15) + '...',
                // Keep raw ISO string for sorting; format for display separately
                created_at: p.created_at,
                timestamp: new Date(p.created_at).toLocaleString(),
                title: p.title || 'Untitled Post',
                content: p.content,
                votes: p.votes || p.score || 0,
                user_vote: p.user_vote,
                commentCount: p.comment_count || 0,
                imageUrl: p.media_url || null,
                mediaType: p.media_type,
                source_instance_url: p.source_instance_url ?? null,
                is_verified: p.is_verified ?? false,
                peer_domain: p.peer_domain ?? null,
                is_federated_post: p.is_federated_post ?? false,
            }));
            setAllPosts(mappedPosts);
        } catch (err) {
            console.error("Failed to fetch feed", err);
        } finally {
            setLoading(false);
        }
    };

    // Re-sort client-side whenever filter changes — no extra network request needed
    const posts = useMemo(() => sortPosts(allPosts, activeFilter), [allPosts, activeFilter]);

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        localStorage.removeItem('graphene_user');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:bg-black dark:from-black dark:via-black dark:to-black transition-colors duration-200">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white">Loading feed...</div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
                                <p className="font-black text-2xl mb-4 text-black dark:text-white">No posts yet!</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="bg-yellow-300 dark:bg-fuchsia-600 border-4 border-black dark:border-gray-700 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white"
                                >
                                    Create First Post
                                </button>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard key={`${post.peer_domain ?? 'local'}-${post.id}`} post={post} />
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

            <footer className="bg-black text-white border-t-4 border-black dark:border-gray-800 mt-16">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center space-y-4">
                        <p className="font-black text-lg">
                            Built with ❤️ by the Graphene Team
                        </p>
                        <div className="flex justify-center items-center gap-6 font-bold flex-wrap">
                            <a
                                href="https://github.com/GrapFene/Graphene_Backend"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white text-black border-3 border-white px-4 py-2 hover:bg-yellow-300 hover:border-yellow-300 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,215,0,0.5)] hover:-translate-y-1 font-black"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                GitHub
                            </a>
                            <button
                                onClick={() => navigate('/about')}
                                className="inline-flex items-center gap-2 bg-cyan-400 text-black border-3 border-cyan-400 px-4 py-2 hover:bg-pink-400 hover:border-pink-400 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,192,203,0.5)] hover:-translate-y-1 font-black"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                About
                            </button>
                            <a
                                href="https://github.com/GrapFene/Graphene_Backend/blob/main/LICENSE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-yellow-300 dark:hover:text-cyan-400 transition-colors"
                            >
                                MIT License
                            </a>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            A Federated, Decentralized Social Network with Sovereign Identity
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
