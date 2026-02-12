import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getPostDetails, createComment, voteComment, Post as ApiPost, Comment } from '../services/api';
import { ArrowUp, ArrowDown, MessageSquare, Share2, Reply } from 'lucide-react';

export default function PostDetailsPage() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<ApiPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const data = await getPostDetails(postId!);
            setPost(data);
        } catch (err) {
            console.error("Failed to fetch post", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (commentId: string, type: 1 | -1) => {
        try {
            await voteComment(commentId, type);
            // In a real app we'd update optimistic state, here just refetch
            fetchPost();
        } catch (error) {
            console.error('Vote failed', error);
        }
    };

    const handleCommentSubmit = async (parentId?: string) => {
        const text = parentId ? replyText : commentText;
        if (!text.trim()) return;

        try {
            await createComment(postId!, text, parentId);
            if (parentId) {
                setReplyText('');
                setReplyingTo(null);
            } else {
                setCommentText('');
            }
            fetchPost();
        } catch (error) {
            console.error('Comment failed', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        navigate('/login');
    };

    const CommentItem = ({ comment }: { comment: Comment }) => (
        <div className="border-l-4 border-gray-200 pl-4 mt-4">
            <div className="flex items-start gap-2 mb-2">
                <span className="font-bold text-sm">u/{comment.author_did.substring(0, 8)}...</span>
                <span className="text-gray-500 text-xs text-bold">• {new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p className="font-medium mb-3 text-lg">{comment.content}</p>

            <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleVote(comment.id, 1)} className="p-1 hover:text-orange-500 hover:bg-orange-100 rounded">
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm">{(comment.vote_score || 0)}</span>
                    <button onClick={() => handleVote(comment.id, -1)} className="p-1 hover:text-blue-500 hover:bg-blue-100 rounded">
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black"
                >
                    <Reply className="w-4 h-4" /> Reply
                </button>
            </div>

            {replyingTo === comment.id && (
                <div className="mb-4 mt-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full border-2 border-black p-2 mb-2 font-medium"
                        placeholder="Write a reply..."
                        rows={3}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCommentSubmit(comment.id)}
                            className="bg-black text-white px-4 py-1 font-bold text-sm hover:bg-gray-800"
                        >
                            Reply
                        </button>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="bg-white border-2 border-black px-4 py-1 font-bold text-sm hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} />
                    ))}
                </div>
            )}
        </div>
    );


    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="font-black text-2xl animate-pulse">Loading post...</div>
        </div>
    );

    if (!post) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="font-black text-2xl mb-4">Post not found</div>
                <button onClick={() => navigate('/')} className="font-bold underline">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Post Content */}
                        <article className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                            <div className="flex">
                                <div className="hidden sm:flex flex-col items-center gap-2 bg-gray-100 border-r-4 border-black p-4">
                                    <button className="bg-white border-3 border-black p-2 hover:bg-green-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                                        <ArrowUp className="w-6 h-6" strokeWidth={3} />
                                    </button>
                                    <span className="font-black text-xl">{post.score || 0}</span>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-red-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                                        <ArrowDown className="w-6 h-6" strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="flex-1 p-6">
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <span
                                            className="bg-yellow-300 border-3 border-black px-3 py-1 font-black text-sm cursor-pointer hover:underline"
                                            onClick={() => navigate(`/r/${post.subreddit}`)}
                                        >
                                            g/{post.subreddit}
                                        </span>
                                        <span className="font-bold text-gray-600 text-sm">Posted by u/{post.author_did.substring(0, 10)}...</span>
                                        <span className="text-gray-500 font-bold text-sm">• {new Date(post.created_at).toLocaleString()}</span>
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-gray-900">
                                        {post.title}
                                    </h1>

                                    <div className="text-gray-800 font-medium text-lg mb-8 leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </div>

                                    <div className="flex items-center gap-6 pt-6 border-t-4 border-black/10">
                                        <div className="flex items-center gap-2 font-black text-gray-500">
                                            <MessageSquare className="w-6 h-6" strokeWidth={3} />
                                            <span>{(post.comments?.length || 0)} Comments</span>
                                        </div>
                                        <button className="flex items-center gap-2 font-black text-gray-500 hover:text-black transition-colors">
                                            <Share2 className="w-6 h-6" strokeWidth={3} />
                                            <span>Share</span>
                                        </button>
                                        <div className="sm:hidden flex items-center gap-4 ml-auto">
                                            <ArrowUp className="w-6 h-6" />
                                            <span className="font-black">{post.score || 0}</span>
                                            <ArrowDown className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Comment Section Input */}
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                            <h3 className="text-xl font-black mb-4">Add a comment</h3>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full border-4 border-black p-4 font-bold text-lg mb-4 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[120px]"
                                placeholder="What are your thoughts?"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleCommentSubmit()}
                                    disabled={!commentText.trim()}
                                    className="bg-black text-white border-4 border-black px-8 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-2xl font-black mb-6">Comments ({post.comments?.length || 0})</h3>
                            <div className="space-y-8">
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map(comment => (
                                        <CommentItem key={comment.id} comment={comment} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 font-bold italic">
                                        No comments yet. Be the first to share your thoughts!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <Sidebar onLogout={handleLogout} onProfileClick={() => navigate('/profile')} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
