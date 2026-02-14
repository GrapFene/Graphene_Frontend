import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import { getPostsByCommunity, Post as ApiPost } from '../services/api';

export default function CommunityPage() {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (name) {
            checkCommunityAndFetchPosts(name);
        }
    }, [name]);

    const checkCommunityAndFetchPosts = async (communityName: string) => {
        setLoading(true);
        try {
            // Check if community exists (optional, could just fetch posts)
            // For now, let's just fetch posts. If empty, it might be valid but empty.
            // But we can also check community details later.
            const data = await getPostsByCommunity(communityName);
            const mappedPosts = data.map((p: ApiPost) => ({
                id: p.id,
                community: p.subreddit,
                author: p.author_did.substring(0, 15) + '...',
                timestamp: new Date(p.created_at).toLocaleString(),
                title: p.title || 'Untitled Post',
                content: p.content,
                votes: p.score || 0,
                commentCount: 0,
                imageUrl: p.media_url || null,
                mediaType: p.media_type
            }));
            setPosts(mappedPosts);
        } catch (err) {
            console.error("Failed to fetch community posts", err);
        } finally {
            setLoading(false);
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
                onCreateCommunity={() => { }}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] mb-6 transition-colors">
                            <h1 className="text-4xl font-black mb-2 text-black dark:text-white">g/{name}</h1>
                            <p className="font-bold text-gray-600 dark:text-gray-300">Community posts</p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white">Loading community posts...</div>
                        ) : posts.length === 0 ? (
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
