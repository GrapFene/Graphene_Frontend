import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getPostDetails, createComment, voteComment, Post as ApiPost, Comment } from '../services/api';
import { ArrowUp, ArrowDown, MessageSquare, Share2, Reply } from 'lucide-react';
import { useVote } from '../hooks/useVote';

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

    const handleCommentVote = async (commentId: string, type: 1 | -1) => {
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

    // Vote Control Component (internal)
    const VoteControl = ({ post }: { post: ApiPost }) => {
        const { votes, userVote, handleVote } = useVote({
            initialVotes: post.votes || 0,
            postId: post.id,
            initialUserVote: post.user_vote
        });

        return (
            <div className="hidden sm:flex flex-col items-center gap-2 bg-gray-100 dark:bg-gray-800 border-r-4 border-black dark:border-gray-600 p-4 transition-colors">
                <button
                    onClick={() => handleVote('up')}
                    className={`bg-white dark:bg-gray-700 border-3 border-black dark:border-gray-500 p-2 hover:bg-green-300 dark:hover:bg-green-900 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${userVote === 'up' ? 'bg-green-300 dark:bg-green-900' : ''}`}
                >
                    <ArrowUp className={`w-6 h-6 ${userVote === 'up' ? 'text-black dark:text-green-200' : 'text-black dark:text-white'}`} strokeWidth={3} />
                </button>
                <span className="font-black text-xl text-black dark:text-white">{votes}</span>
                <button
                    onClick={() => handleVote('down')}
                    className={`bg-white dark:bg-gray-700 border-3 border-black dark:border-gray-500 p-2 hover:bg-red-300 dark:hover:bg-red-900 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${userVote === 'down' ? 'bg-red-300 dark:bg-red-900' : ''}`}
                >
                    <ArrowDown className={`w-6 h-6 ${userVote === 'down' ? 'text-black dark:text-red-200' : 'text-black dark:text-white'}`} strokeWidth={3} />
                </button>
            </div>
        );
    };

    const MobileVoteControl = ({ post }: { post: ApiPost }) => {
        const { votes, userVote, handleVote } = useVote({
            initialVotes: post.votes || 0,
            postId: post.id,
            initialUserVote: post.user_vote
        });

        return (
            <div className="sm:hidden flex items-center gap-4 ml-auto">
                <button onClick={() => handleVote('up')} className={userVote === 'up' ? 'text-green-600 dark:text-green-400' : 'text-black dark:text-white'}>
                    <ArrowUp className="w-6 h-6" />
                </button>
                <span className="font-black text-black dark:text-white">{votes}</span>
                <button onClick={() => handleVote('down')} className={userVote === 'down' ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}>
                    <ArrowDown className="w-6 h-6" />
                </button>
            </div>
        );
    };

    const CommentItem = ({ comment }: { comment: Comment }) => (
        <div className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 mt-4">
            <div className="flex items-start gap-2 mb-2">
                <span className="font-bold text-sm text-black dark:text-white">u/{comment.author_did.substring(0, 8)}...</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs text-bold">• {new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p className="font-medium mb-3 text-lg text-black dark:text-gray-300">{comment.content}</p>

            <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleCommentVote(comment.id, 1)} className="p-1 hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-gray-700 rounded text-black dark:text-white">
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm text-black dark:text-white">{(comment.vote_score || 0)}</span>
                    <button onClick={() => handleCommentVote(comment.id, -1)} className="p-1 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded text-black dark:text-white">
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                >
                    <Reply className="w-4 h-4" /> Reply
                </button>
            </div>

            {replyingTo === comment.id && (
                <div className="mb-4 mt-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full border-2 border-black dark:border-gray-500 p-2 mb-2 font-medium bg-white dark:bg-gray-800 text-black dark:text-white"
                        placeholder="Write a reply..."
                        rows={3}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCommentSubmit(comment.id)}
                            className="bg-black dark:bg-white text-white dark:text-black px-4 py-1 font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
                        >
                            Reply
                        </button>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-500 px-4 py-1 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="font-black text-2xl animate-pulse text-black dark:text-white">Loading post...</div>
        </div>
    );

    if (!post) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="text-center">
                <div className="font-black text-2xl mb-4 text-black dark:text-white">Post not found</div>
                <button onClick={() => navigate('/')} className="font-bold underline text-black dark:text-white">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Post Content */}
                        <article className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] mb-8 transition-colors">
                            <div className="flex">
                                <VoteControl post={post} />

                                <div className="flex-1 p-6">
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <span
                                            className="bg-yellow-300 dark:bg-yellow-600 border-3 border-black dark:border-gray-900 px-3 py-1 font-black text-sm cursor-pointer hover:underline text-black dark:text-white"
                                            onClick={() => navigate(`/r/${post.subreddit}`)}
                                        >
                                            g/{post.subreddit}
                                        </span>
                                        <span className="font-bold text-gray-600 dark:text-gray-400 text-sm">Posted by u/{post.author_did.substring(0, 10)}...</span>
                                        <span className="text-gray-500 dark:text-gray-500 font-bold text-sm">• {new Date(post.created_at).toLocaleString()}</span>
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-gray-900 dark:text-white">
                                        {post.title}
                                    </h1>

                                    <div className="text-gray-800 dark:text-gray-300 font-medium text-lg mb-8 leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </div>

                                    <div className="flex items-center gap-6 pt-6 border-t-4 border-black/10 dark:border-white/10">
                                        <div className="flex items-center gap-2 font-black text-gray-500 dark:text-gray-400">
                                            <MessageSquare className="w-6 h-6" strokeWidth={3} />
                                            <span>{(post.comments?.length || 0)} Comments</span>
                                        </div>
                                        <button className="flex items-center gap-2 font-black text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                            <Share2 className="w-6 h-6" strokeWidth={3} />
                                            <span>Share</span>
                                        </button>

                                        <MobileVoteControl post={post} />
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Comment Section Input */}
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] mb-8 transition-colors">
                            <h3 className="text-xl font-black mb-4 text-black dark:text-white">Add a comment</h3>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full border-4 border-black dark:border-gray-500 p-4 font-bold text-lg mb-4 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] min-h-[120px] bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder="What are your thoughts?"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleCommentSubmit()}
                                    disabled={!commentText.trim()}
                                    className="bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-8 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-colors">
                            <h3 className="text-2xl font-black mb-6 text-black dark:text-white">Comments ({post.comments?.length || 0})</h3>
                            <div className="space-y-8">
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map(comment => (
                                        <CommentItem key={comment.id} comment={comment} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-bold italic">
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
