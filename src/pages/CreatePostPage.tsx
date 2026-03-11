import { useState, useEffect, useRef } from 'react';
import { X, Image, Link as LinkIcon, BarChart3, MessageCircle, Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, ChevronDown, Search, Globe } from 'lucide-react';
import { createPost, getCommunities, getActivePeers, getTopCommunitiesFromPeer } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

type PostType = 'text' | 'image' | 'link' | 'poll';

export default function CreatePostPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [postType, setPostType] = useState<PostType>('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [subreddit, setSubreddit] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [search, setSearch] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCommunities();
    }, []);

    // Close picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchCommunities = async () => {
        try {
            const [mainData, peers] = await Promise.all([
                getCommunities(),
                getActivePeers(),
            ]);
            const peerCommunityArrays = await Promise.all(
                peers.map(p => getTopCommunitiesFromPeer(p.domain, 50))
            );
            const peerCommunities = peerCommunityArrays.flat();
            const mainNames = new Set(mainData.map((c: any) => c.name));
            const uniquePeer = peerCommunities.filter(c => !mainNames.has(c.name));
            const allCommunities = [...mainData, ...uniquePeer];
            setCommunities(allCommunities);

            const preselect = searchParams.get('community');
            if (preselect && allCommunities.some((c: any) => c.name === preselect)) {
                setSubreddit(preselect);
            } else if (allCommunities.length > 0) {
                setSubreddit(allCommunities[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch communities', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
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
            await createPost(title, postContent, subreddit, mediaFile);
            navigate('/');
        } catch (err: any) {
            // Extract backend error message from axios response if available
            const backendMsg = err?.response?.data?.error;
            setError(backendMsg || err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const selectedCommunity = communities.find(c => c.name === subreddit);
    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    // Color based on first letter
    const communityColor = (name: string) => {
        const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-cyan-400'];
        return colors[name.charCodeAt(0) % colors.length];
    };

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

                    {/* Community Picker */}
                    <div className="border-b-4 border-black dark:border-gray-600 p-4" ref={pickerRef}>
                        <p className="font-black text-sm text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Post to</p>

                        {/* Trigger button */}
                        <button
                            type="button"
                            onClick={() => setPickerOpen(o => !o)}
                            className="w-full flex items-center gap-3 px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                        >
                            {selectedCommunity ? (
                                <>
                                    <div className={`w-9 h-9 ${communityColor(selectedCommunity.name)} border-2 border-black flex items-center justify-center font-black text-sm shrink-0`}>
                                        {selectedCommunity.name[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className="font-black text-black dark:text-white text-lg">g/{selectedCommunity.name}</span>
                                        {selectedCommunity.is_federated && (
                                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 font-bold border border-blue-300 dark:border-blue-700">
                                                🌐 {selectedCommunity.peer_domain || selectedCommunity.home_instance_domain}
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="font-bold text-gray-400 flex-1 text-left">Choose a community...</span>
                            )}
                            <ChevronDown className={`w-5 h-5 text-black dark:text-white transition-transform ${pickerOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                        </button>

                        {/* Dropdown panel */}
                        {pickerOpen && (
                            <div className="mt-2 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-72 overflow-y-auto z-50">
                                {/* Search */}
                                <div className="sticky top-0 border-b-4 border-black dark:border-gray-600 p-2 bg-white dark:bg-gray-800 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-gray-500 shrink-0" strokeWidth={3} />
                                    <input
                                        autoFocus
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search communities..."
                                        className="flex-1 font-bold bg-transparent outline-none text-black dark:text-white placeholder-gray-400"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')}>
                                            <X className="w-4 h-4 text-gray-400" strokeWidth={3} />
                                        </button>
                                    )}
                                </div>

                                {/* Community list */}
                                {filteredCommunities.length === 0 ? (
                                    <p className="p-4 font-bold text-gray-400 text-center">No communities found</p>
                                ) : (
                                    filteredCommunities.map(c => (
                                        <button
                                            key={`${c.peer_domain ?? 'local'}-${c.name}`}
                                            type="button"
                                            onClick={() => { setSubreddit(c.name); setPickerOpen(false); setSearch(''); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0
                                                ${subreddit === c.name ? 'bg-yellow-50 dark:bg-gray-700 border-l-4 border-l-yellow-400' : ''}`}
                                        >
                                            <div className={`w-9 h-9 ${communityColor(c.name)} border-2 border-black flex items-center justify-center font-black text-sm shrink-0`}>
                                                {c.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-black text-black dark:text-white truncate">g/{c.name}</p>
                                                {c.is_federated && (
                                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                        <Globe className="w-3 h-3" strokeWidth={3} />
                                                        {c.peer_domain || c.home_instance_domain}
                                                    </p>
                                                )}
                                                {c.description && (
                                                    <p className="text-xs text-gray-400 truncate">{c.description}</p>
                                                )}
                                            </div>
                                            {subreddit === c.name && (
                                                <div className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Federated notice */}
                        {selectedCommunity?.is_federated && (
                            <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                <Globe className="w-4 h-4 shrink-0" strokeWidth={3} />
                                Post will be hosted on <span className="font-black">{selectedCommunity.peer_domain || selectedCommunity.home_instance_domain}</span>
                            </div>
                        )}
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
                                {!mediaPreview ? (
                                    <div className="border-4 border-dashed border-black p-12 text-center bg-gray-50">
                                        <Image className="w-16 h-16 mx-auto mb-4" strokeWidth={3} />
                                        <p className="font-black text-xl mb-2">Drag and drop images or videos</p>
                                        <label htmlFor="create-post-upload" className="cursor-pointer bg-yellow-300 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 inline-block">
                                            Upload
                                        </label>
                                        <input
                                            id="create-post-upload"
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            onClick={(e) => (e.currentTarget.value = '')}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative mb-4 border-4 border-black inline-block bg-gray-100">
                                        <button
                                            onClick={handleRemoveMedia}
                                            className="absolute -top-3 -right-3 bg-red-400 border-2 border-black p-1 hover:bg-red-500 transition-colors z-10"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        {mediaFile?.type.startsWith('video/') ? (
                                            <video src={mediaPreview} controls className="max-h-96" />
                                        ) : (
                                            <img src={mediaPreview} alt="Preview" className="max-h-96 object-contain" />
                                        )}
                                    </div>
                                )}
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
