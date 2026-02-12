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
                imageUrl: null
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
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100">
            <Header
                onCreatePost={() => navigate('/submit')}
                onCreateCommunity={() => { }}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
                            <h1 className="text-4xl font-black mb-2">g/{name}</h1>
                            <p className="font-bold text-gray-600">Community posts</p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold">Loading community posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-2xl mb-4">No posts here yet!</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="bg-yellow-300 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
