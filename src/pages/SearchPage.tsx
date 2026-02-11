import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getCommunities, Community } from '../services/api';
import { Users } from 'lucide-react';

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    const [results, setResults] = useState<Community[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            fetchResults(query);
        }
    }, [query]);

    const fetchResults = async (searchQuery: string) => {
        setLoading(true);
        try {
            const data = await getCommunities(searchQuery);
            setResults(data);
        } catch (err) {
            console.error("Failed to search communities", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
                            <h1 className="text-4xl font-black mb-2">Search Results</h1>
                            <p className="font-bold text-gray-600">Results for "{query}"</p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold">Searching...</div>
                        ) : results.length === 0 ? (
                            <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-2xl mb-4">No communities found.</p>
                                <p className="font-bold">Try a different search term.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {results.map((community) => (
                                    <div
                                        key={community.name}
                                        onClick={() => navigate(`/r/${community.name}`)}
                                        className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-purple-400 border-3 border-black flex items-center justify-center font-black text-xl">
                                                    {community.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl">g/{community.name}</h3>
                                                    <p className="text-gray-600 font-bold text-sm flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {(community.members || 0).toLocaleString()} members
                                                    </p>
                                                    <p className="text-gray-800 mt-1 font-medium">{community.description}</p>
                                                </div>
                                            </div>
                                            <button className="bg-black text-white px-4 py-2 font-bold hover:bg-gray-800">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
