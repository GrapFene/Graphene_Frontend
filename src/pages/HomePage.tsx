import { useState, useEffect } from 'react';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { getFeed, Post as ApiPost } from '../services/api';

export default function HomePage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
                title: 'Post',
                content: p.content,
                votes: p.score || 0,
                commentCount: 0,
                imageUrl: null
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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <FilterBar />
                        {loading ? (
                            <div className="text-center font-bold">Loading feed...</div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-2xl mb-4">No posts yet!</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="bg-yellow-300 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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

            <footer className="bg-black text-white border-t-4 border-black mt-16">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-black text-lg mb-3">About</h4>
                            <ul className="space-y-2 font-bold">
                                <li><a href="#" className="hover:text-yellow-300">About Us</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Careers</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Press</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-lg mb-3">Community</h4>
                            <ul className="space-y-2 font-bold">
                                <li><a href="#" className="hover:text-yellow-300">Guidelines</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Help</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-lg mb-3">Legal</h4>
                            <ul className="space-y-2 font-bold">
                                <li><a href="#" className="hover:text-yellow-300">Privacy</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Terms</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Cookie Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-lg mb-3">Follow</h4>
                            <ul className="space-y-2 font-bold">
                                <li><a href="#" className="hover:text-yellow-300">Twitter</a></li>
                                <li><a href="#" className="hover:text-yellow-300">Discord</a></li>
                                <li><a href="#" className="hover:text-yellow-300">GitHub</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t-2 border-white text-center font-black">
                        <p>GrapFene © 2024 - Brutally Honest Social Media</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
