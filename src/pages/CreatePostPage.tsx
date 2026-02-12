import { useState, useEffect } from 'react';
import { X, Image, Link as LinkIcon, BarChart3, MessageCircle, Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote } from 'lucide-react';
import { createPost, getCommunities } from '../services/api';
import { useNavigate } from 'react-router-dom';

type PostType = 'text' | 'image' | 'link' | 'poll';

export default function CreatePostPage() {
    const navigate = useNavigate();
    const [postType, setPostType] = useState<PostType>('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [subreddit, setSubreddit] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        try {
            const data = await getCommunities();
            setCommunities(data);
            if (data.length > 0) {
                setSubreddit(data[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch communities', err);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !subreddit) {
            setError('Please add a title and select a community');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let postContent = content;
            if (postType === 'link' && linkUrl) {
                postContent = `${content}\n\nLink: ${linkUrl}`;
            }

            await createPost(title, postContent, subreddit);
            navigate('/'); // Navigate back to home feed
        } catch (err: any) {
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const communityColors: Record<string, string> = {
        tech: 'bg-green-400',
        design: 'bg-pink-400',
        music: 'bg-yellow-300',
        gaming: 'bg-cyan-400',
        art: 'bg-red-400',
    };

    const selectedCommunity = communities.find(c => c.name === subreddit);
    const bgColor = selectedCommunity ? (communityColors[selectedCommunity.name] || 'bg-purple-400') : 'bg-purple-400';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-4xl font-black text-black dark:text-white">Create post</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white dark:bg-gray-800 text-black dark:text-white border-4 border-black dark:border-gray-600 px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                    >
                        Cancel
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                    {/* Community Selector */}
                    <div className="border-b-4 border-black dark:border-gray-600 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${bgColor} border-3 border-black flex items-center justify-center font-black`}>
                                g/
                            </div>
                            <select
                                value={subreddit}
                                onChange={(e) => setSubreddit(e.target.value)}
                                className="flex-1 px-4 py-2 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold text-lg focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            >
                                {communities.map((community) => (
                                    <option key={community.name} value={community.name}>
                                        g/{community.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Post Type Tabs */}
                    <div className="border-b-4 border-black dark:border-gray-600 flex overflow-x-auto">
                        <button
                            onClick={() => setPostType('text')}
                            className={`flex-1 px-6 py-3 font-black border-r-4 border-black dark:border-gray-600 transition-colors whitespace-nowrap ${postType === 'text' ? 'bg-blue-300 dark:bg-blue-600 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <MessageCircle className="w-5 h-5" strokeWidth={3} />
                                Text
                            </span>
                        </button>
                        <button
                            onClick={() => setPostType('image')}
                            className={`flex-1 px-6 py-3 font-black border-r-4 border-black dark:border-gray-600 transition-colors whitespace-nowrap ${postType === 'image' ? 'bg-blue-300 dark:bg-blue-600 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Image className="w-5 h-5" strokeWidth={3} />
                                Images & Video
                            </span>
                        </button>
                        <button
                            onClick={() => setPostType('link')}
                            className={`flex-1 px-6 py-3 font-black border-r-4 border-black dark:border-gray-600 transition-colors whitespace-nowrap ${postType === 'link' ? 'bg-blue-300 dark:bg-blue-600 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <LinkIcon className="w-5 h-5" strokeWidth={3} />
                                Link
                            </span>
                        </button>
                        <button
                            onClick={() => setPostType('poll')}
                            className={`flex-1 px-6 py-3 font-black transition-colors whitespace-nowrap ${postType === 'poll' ? 'bg-blue-300 dark:bg-blue-600 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <BarChart3 className="w-5 h-5" strokeWidth={3} />
                                Poll
                            </span>
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-300 border-4 border-black p-4 font-bold animate-bounce">
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title*"
                                maxLength={300}
                                className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold text-lg focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <div className="text-right text-sm font-bold text-gray-500 mt-1">
                                {title.length}/300
                            </div>
                        </div>

                        {/* Text Post */}
                        {postType === 'text' && (
                            <div>
                                {/* Formatting Toolbar */}
                                <div className="bg-gray-100 dark:bg-gray-700 border-4 border-black dark:border-gray-500 p-2 flex gap-2 flex-wrap mb-2">
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <Bold className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <Italic className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <Strikethrough className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <Code className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <List className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <ListOrdered className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button className="bg-white border-3 border-black p-2 hover:bg-gray-200 transition-colors">
                                        <Quote className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                </div>

                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Body text (optional)"
                                    rows={12}
                                    className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] resize-none placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                        )}

                        {/* Image/Video Post */}
                        {postType === 'image' && (
                            <div>
                                <div className="border-4 border-dashed border-black p-12 text-center bg-gray-50">
                                    <Image className="w-16 h-16 mx-auto mb-4" strokeWidth={3} />
                                    <p className="font-black text-xl mb-2">Drag and drop images or videos</p>
                                    <button className="bg-yellow-300 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                        Upload
                                    </button>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Add a description (optional)"
                                    rows={4}
                                    className="w-full px-4 py-3 border-4 border-black font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none mt-4"
                                />
                            </div>
                        )}

                        {/* Link Post */}
                        {postType === 'link' && (
                            <div className="space-y-4">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="URL*"
                                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                />
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Add a description (optional)"
                                    rows={6}
                                    className="w-full px-4 py-3 border-4 border-black font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                                />
                            </div>
                        )}

                        {/* Poll Post */}
                        {postType === 'poll' && (
                            <div className="space-y-4">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Poll question"
                                    rows={3}
                                    className="w-full px-4 py-3 border-4 border-black font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                                />
                                <div className="bg-yellow-100 border-4 border-black p-4 font-bold">
                                    Poll creation coming soon!
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t-4 border-black dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <button className="bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title.trim()}
                            className="bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-8 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
