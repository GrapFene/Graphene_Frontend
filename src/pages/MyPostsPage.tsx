import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MnemonicVerificationModal from '../components/MnemonicVerificationModal';
import { getActivePeers } from '../services/api';
import { Edit2, Trash2, Users, Globe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * My Posts Page Component
 *
 * Fetches posts from the main server AND every known peer server, merges them,
 * and routes delete / edit to the correct server automatically.
 */
export default function MyPostsPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        type: 'edit' | 'delete';
        postId: string;
        peerDomain: string | null;
    } | null>(null);
    const [editingPost, setEditingPost] = useState<{
        id: string;
        title: string;
        content: string;
        peer_domain: string | null;
    } | null>(null);

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

            // ── 1. Fetch from main backend ────────────────────────────────
            const mainFetch = fetch(`${API_BASE}/posts/user/${user.did}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.ok ? r.json() : []).catch(() => []);

            // ── 2. Fetch from every known peer in parallel ────────────────
            let peerPosts: any[] = [];
            try {
                const peers = await getActivePeers();
                const peerFetches = peers.map(({ domain }) =>
                    fetch(`https://${domain}/api/posts/user/${user.did}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    })
                        .then(r => r.ok ? r.json() : [])
                        .then((posts: any[]) =>
                            posts.map((p: any) => ({ ...p, _peer_domain: domain }))
                        )
                        .catch(() => [])
                );
                const peerResults = await Promise.all(peerFetches);
                peerPosts = peerResults.flat();
            } catch {
                // peers unavailable — continue with main-only
            }

            const mainPosts: any[] = await mainFetch;

            // ── 3. Merge & deduplicate by id ──────────────────────────────
            const seen = new Set<string>();
            const allRaw = [
                ...mainPosts.map((p: any) => ({ ...p, _peer_domain: null })),
                ...peerPosts,
            ].filter(p => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
            });

            // ── 4. Sort newest first ──────────────────────────────────────
            allRaw.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const mappedPosts = allRaw.map((p: any) => ({
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
                mediaType: p.media_type,
                peer_domain: p._peer_domain ?? null,
            }));

            setPosts(mappedPosts);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (post: any) => {
        setPendingAction({ type: 'edit', postId: post.id, peerDomain: post.peer_domain });
        setEditingPost({ id: post.id, title: post.title, content: post.content, peer_domain: post.peer_domain });
        setShowVerificationModal(true);
    };

    const handleDeleteClick = (post: any) => {
        setPendingAction({ type: 'delete', postId: post.id, peerDomain: post.peer_domain });
        setShowVerificationModal(true);
    };

    const verifyMnemonicAndProceed = async (wordHashes: string[], indices: number[]): Promise<boolean> => {
        try {
            const userStr = localStorage.getItem('graphene_user');
            if (!userStr) return false;

            const user = JSON.parse(userStr);
            const token = localStorage.getItem('graphene_token');

            const response = await fetch(`${API_BASE}/auth/verify-challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ did: user.did, word_hashes: wordHashes, indices })
            });

            if (!response.ok) return false;

            const data = await response.json();
            const isValid = data.success;

            if (isValid && pendingAction) {
                if (pendingAction.type === 'delete') {
                    await deletePost(pendingAction.postId, pendingAction.peerDomain);
                }
                setPendingAction(null);
            }

            return isValid;
        } catch (err) {
            console.error('Mnemonic verification failed', err);
            return false;
        }
    };

    /**
     * Delete a post.
     * - Local post  → DELETE ${API_BASE}/posts/${id}
     * - Peer post   → DELETE ${API_BASE}/posts/${id}?peer_domain=${domain}
     *   The main backend will forward the request to the correct peer server.
     */
    const deletePost = async (postId: string, peerDomain: string | null) => {
        try {
            const token = localStorage.getItem('graphene_token');
            const url = peerDomain
                ? `${API_BASE}/posts/${postId}?peer_domain=${encodeURIComponent(peerDomain)}`
                : `${API_BASE}/posts/${postId}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({})) as any;
                throw new Error(body?.error ?? 'Failed to delete post');
            }

            setPosts(prev => prev.filter(p => p.id !== postId));
            alert('Post deleted successfully!');
        } catch (err: any) {
            console.error('Failed to delete post', err);
            alert(`Failed to delete post: ${err.message}`);
        }
    };

    /**
     * Save edit.
     * - Local post  → PUT ${API_BASE}/posts/${id}
     * - Peer post   → PUT ${API_BASE}/posts/${id}?peer_domain=${domain}
     */
    const handleUpdatePost = async () => {
        if (!editingPost) return;

        try {
            const token = localStorage.getItem('graphene_token');
            const url = editingPost.peer_domain
                ? `${API_BASE}/posts/${editingPost.id}?peer_domain=${encodeURIComponent(editingPost.peer_domain)}`
                : `${API_BASE}/posts/${editingPost.id}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: editingPost.title, content: editingPost.content })
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({})) as any;
                throw new Error(body?.error ?? 'Failed to update post');
            }

            setPosts(prev => prev.map(p =>
                p.id === editingPost.id
                    ? { ...p, title: editingPost.title, content: editingPost.content }
                    : p
            ));
            setEditingPost(null);
            alert('Post updated successfully!');
        } catch (err: any) {
            console.error('Failed to update post', err);
            alert(`Failed to update post: ${err.message}`);
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
                    // Don't clear editingPost here — user edits after verification
                }}
                onVerify={verifyMnemonicAndProceed}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
                            <h1 className="text-3xl font-black mb-2 text-black dark:text-white">My Posts</h1>
                            <p className="font-bold text-gray-600 dark:text-gray-400">
                                All your posts across every server
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white">Loading your posts…</div>
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
                            posts.map((post) => {
                                // Capture and narrow editingPost for this iteration
                                const ep = (editingPost?.id === post.id) ? editingPost : null;
                                return (
                                <article
                                    key={`${post.peer_domain ?? 'local'}-${post.id}`}
                                    className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] transition-all duration-200"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                            <span
                                                className={`${communityColors[post.community] || 'bg-purple-400'} border-3 border-black dark:border-gray-700 px-3 py-1 font-black text-sm text-black cursor-pointer hover:opacity-80`}
                                                onClick={() => navigate(`/r/${post.community}`)}
                                            >
                                                g/{post.community}
                                            </span>
                                            {post.peer_domain && (
                                                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-600 px-2 py-0.5 font-bold text-xs text-blue-700 dark:text-blue-300">
                                                    <Globe className="w-3 h-3" />
                                                    {post.peer_domain}
                                                </span>
                                            )}
                                            <span className="text-gray-500 dark:text-gray-400 font-bold">{post.timestamp}</span>
                                        </div>

                                        {ep ? (
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={ep.title}
                                                    onChange={(e) => setEditingPost({ id: ep.id, title: e.target.value, content: ep.content, peer_domain: ep.peer_domain })}
                                                    className="w-full text-2xl font-black p-2 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                                                />
                                                <textarea
                                                    value={ep.content}
                                                    onChange={(e) => setEditingPost({ id: ep.id, title: ep.title, content: e.target.value, peer_domain: ep.peer_domain })}
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
                                                            onClick={() => handleDeleteClick(post)}
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
                                );
                            })
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
