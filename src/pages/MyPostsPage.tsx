import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MnemonicVerificationModal from '../components/MnemonicVerificationModal';
import { Post as ApiPost } from '../services/api';
import { Edit2, Trash2, Users } from 'lucide-react';

/**
 * My Posts Page Component
 * 
 * Functionality: Displays all posts created by the current user with edit/delete capabilities.
 * Input: None
 * Response: JSX.Element - The rendered my posts page.
 */
export default function MyPostsPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete', postId: string } | null>(null);
    const [editingPost, setEditingPost] = useState<{ id: string, title: string, content: string } | null>(null);

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('graphene_user');
            if (!userStr) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(userStr);
            const token = localStorage.getItem('graphene_token');

            const response = await fetch(`http://localhost:3000/posts/user/${user.did}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch posts');

            const data = await response.json();
            const mappedPosts = data.map((p: ApiPost) => ({
                id: p.id,
                community: p.subreddit || 'general',
                author: user.did,
                timestamp: new Date(p.created_at).toLocaleString(),
                title: p.title || 'Untitled Post',
                content: p.content,
                votes: p.score || 0,
                user_vote: p.user_vote,
                commentCount: p.comment_count || 0,
                imageUrl: p.media_url || null,
                mediaType: p.media_type
            }));
            setPosts(mappedPosts);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (post: any) => {
        setPendingAction({ type: 'edit', postId: post.id });
        setEditingPost({ id: post.id, title: post.title, content: post.content });
        setShowVerificationModal(true);
    };

    const handleDeleteClick = (postId: string) => {
        setPendingAction({ type: 'delete', postId });
        setShowVerificationModal(true);
    };

    const verifyMnemonicAndProceed = async (wordHashes: string[], indices: number[]): Promise<boolean> => {
        try {
            const userStr = localStorage.getItem('graphene_user');
            if (!userStr) return false;

            const user = JSON.parse(userStr);
            const token = localStorage.getItem('graphene_token');

            console.log('🔐 [MY POSTS] Verifying mnemonic...');
            console.log('  - Pending Action:', pendingAction);

            // Call backend to verify the challenge
            const response = await fetch('http://localhost:3000/auth/verify-challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    did: user.did,
                    word_hashes: wordHashes,
                    indices: indices
                })
            });

            if (!response.ok) {
                console.log('  ❌ Verification failed - response not ok');
                return false;
            }

            const data = await response.json();
            const isValid = data.success;

            console.log('  - Verification result:', isValid ? '✅ SUCCESS' : '❌ FAILED');

            if (isValid && pendingAction) {
                console.log('  - Executing action:', pendingAction.type);
                if (pendingAction.type === 'delete') {
                    await deletePost(pendingAction.postId);
                } else if (pendingAction.type === 'edit') {
                    console.log('  - Edit mode enabled, user can now edit the post');
                }
                // For edit, we just verify and let the user edit in the UI
                setPendingAction(null);
            }

            return isValid;
        } catch (err) {
            console.error('🔴 [MY POSTS] Mnemonic verification failed', err);
            return false;
        }
    };

    const deletePost = async (postId: string) => {
        console.log('🗑️ [MY POSTS] Deleting post:', postId);
        try {
            const token = localStorage.getItem('graphene_token');
            const response = await fetch(`http://localhost:3000/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('  - Delete response status:', response.status);

            if (!response.ok) throw new Error('Failed to delete post');

            // Remove post from list
            setPosts(posts.filter(p => p.id !== postId));
            console.log('  ✅ Post deleted successfully');
            alert('Post deleted successfully!');
        } catch (err) {
            console.error('  ❌ Failed to delete post', err);
            alert('Failed to delete post. Please try again.');
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost) return;

        try {
            const token = localStorage.getItem('graphene_token');
            const response = await fetch(`http://localhost:3000/posts/${editingPost.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editingPost.title,
                    content: editingPost.content
                })
            });

            if (!response.ok) throw new Error('Failed to update post');

            // Update post in list
            setPosts(posts.map(p => 
                p.id === editingPost.id 
                    ? { ...p, title: editingPost.title, content: editingPost.content }
                    : p
            ));
            setEditingPost(null);
            alert('Post updated successfully!');
        } catch (err) {
            console.error('Failed to update post', err);
            alert('Failed to update post. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        localStorage.removeItem('graphene_user');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
    };

    const communityColors: Record<string, string> = {
        tech: 'bg-green-400',
        design: 'bg-pink-400',
        music: 'bg-yellow-300',
        gaming: 'bg-cyan-400',
        art: 'bg-red-400',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:bg-black dark:from-black dark:via-black dark:to-black transition-colors duration-200">
            <Header onCreatePost={() => navigate('/submit')} />

            <MnemonicVerificationModal
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false);
                    setPendingAction(null);
                    // DON'T clear editingPost here - let it persist so user can edit after verification!
                }}
                onVerify={verifyMnemonicAndProceed}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
                            <h1 className="text-3xl font-black mb-2 text-black dark:text-white">My Posts</h1>
                            <p className="font-bold text-gray-600 dark:text-gray-400">
                                Manage all your posts across communities
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white">Loading your posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
                                <p className="font-black text-2xl mb-4 text-black dark:text-white">No posts yet!</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="bg-yellow-300 dark:bg-fuchsia-600 border-4 border-black dark:border-gray-700 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white"
                                >
                                    Create Your First Post
                                </button>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <article 
                                    key={post.id}
                                    className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] transition-all duration-200"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span 
                                                className={`${communityColors[post.community] || 'bg-purple-400'} border-3 border-black dark:border-gray-700 px-3 py-1 font-black text-sm text-black cursor-pointer hover:opacity-80`}
                                                onClick={() => navigate(`/r/${post.community}`)}
                                            >
                                                g/{post.community}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400 font-bold">{post.timestamp}</span>
                                        </div>

                                        {editingPost?.id === post.id && editingPost ? (
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={editingPost.title}
                                                    onChange={(e) => setEditingPost({ id: editingPost.id, title: e.target.value, content: editingPost.content })}
                                                    className="w-full text-2xl font-black p-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                                                />
                                                <textarea
                                                    value={editingPost.content}
                                                    onChange={(e) => setEditingPost({ id: editingPost.id, title: editingPost.title, content: e.target.value })}
                                                    className="w-full font-medium p-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                                                    rows={4}
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleUpdatePost}
                                                        className="bg-green-400 dark:bg-green-600 border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white"
                                                    >
                                                        Save Changes
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingPost(null)}
                                                        className="bg-gray-300 dark:bg-gray-700 border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h2
                                                    className="text-2xl font-black mb-3 leading-tight hover:underline cursor-pointer text-black dark:text-white"
                                                    onClick={() => navigate(`/r/${post.community}/${post.id}/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                                                >
                                                    {post.title}
                                                </h2>

                                                <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 leading-relaxed">
                                                    {post.content}
                                                </p>

                                                {post.imageUrl && (
                                                    <div className="mb-4 border-4 border-black dark:border-gray-700">
                                                        {post.mediaType === 'video' ? (
                                                            <video src={post.imageUrl} controls className="w-full" />
                                                        ) : (
                                                            <img src={post.imageUrl} alt="" className="w-full" />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-bold">
                                                        <Users className="w-5 h-5" />
                                                        <span>{post.votes} votes</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-bold">
                                                        <span>{post.commentCount} comments</span>
                                                    </div>
                                                    <div className="ml-auto flex gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(post)}
                                                            className="flex items-center gap-2 bg-blue-400 dark:bg-blue-600 border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(post.id)}
                                                            className="flex items-center gap-2 bg-red-400 dark:bg-red-600 border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </article>
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
