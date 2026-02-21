import { useState, useEffect } from 'react';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/FilterBar';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { useNavigate } from 'react-router-dom';
import { getFeed, Post as ApiPost } from '../services/api';

/**
 * Home Page Component
 * 
 * Functionality: Main landing page displaying the feed, sidebar, and filter bar.
 * Input: None
 * Response: JSX.Element - The rendered home page.
 */
export default function HomePage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCommunityModal, setShowCommunityModal] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await getFeed('recent');
            const mappedPosts = data.map((p: ApiPost) => ({
                id: p.id,
                community: p.subreddit || 'general',
                author: p.author_did.substring(0, 15) + '...',
                timestamp: new Date(p.created_at).toLocaleString(),
                title: p.title || 'Untitled Post',
                content: p.content,
                votes: p.votes || 0,
                user_vote: p.user_vote,
                commentCount: p.comment_count || 0,
                imageUrl: p.media_url || null,
                mediaType: p.media_type
            }));
            setPosts(mappedPosts);
        } catch (err) {
            console.error("Failed to fetch feed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        localStorage.removeItem('graphene_user');

        // Trigger auth state update
        window.dispatchEvent(new Event('authChange'));

        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:bg-black dark:from-black dark:via-black dark:to-black transition-colors duration-200">
            <Header
                onCreatePost={() => navigate('/submit')}
                onCreateCommunity={() => setShowCommunityModal(true)}
            />

            <CreateCommunityModal
                isOpen={showCommunityModal}
                onClose={() => setShowCommunityModal(false)}
                onSuccess={() => {
                    setShowCommunityModal(false);
                    fetchPosts(); // Refresh feed after creating community
                }}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <FilterBar />
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
