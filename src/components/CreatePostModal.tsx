import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPost, getCommunities } from '../services/api';

interface CreatePostModalProps {
    onClose: () => void;
    onPostCreated: () => void;
}

export default function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [subreddit, setSubreddit] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !subreddit) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createPost(content, subreddit);
            onPostCreated();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
                <div className="bg-yellow-300 border-b-4 border-black p-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black">Create Post</h2>
                    <button
                        onClick={onClose}
                        className="bg-white border-3 border-black p-2 hover:bg-red-300 transition-colors"
                    >
                        <X className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-300 border-3 border-black p-3 font-bold">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block font-black mb-2">Community</label>
                        <select
                            value={subreddit}
                            onChange={(e) => setSubreddit(e.target.value)}
                            className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            {communities.map((community) => (
                                <option key={community.name} value={community.name}>
                                    g/{community.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-black mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            rows={6}
                            className="w-full px-4 py-2 border-4 border-black font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
