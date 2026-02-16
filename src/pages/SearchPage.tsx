import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getCommunities, Community } from '../services/api';
import { Users } from 'lucide-react';

/**
 * Search Page Component
 * 
 * Functionality: Displays search results for communities based on a query.
 * Input: None (Uses useSearchParams to get query)
 * Response: JSX.Element - The rendered search page.
 */
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
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] mb-6 transition-colors">
                            <h1 className="text-4xl font-black mb-2 text-black dark:text-white">Search Results</h1>
                            <p className="font-bold text-gray-600 dark:text-gray-300">Results for "{query}"</p>
                        </div>

                        {loading ? (
                            <div className="text-center font-bold text-black dark:text-white">Searching...</div>
                        ) : results.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-colors">
                                <p className="font-black text-2xl mb-4 text-black dark:text-white">No communities found.</p>
                                <p className="font-bold text-black dark:text-white">Try a different search term.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {results.map((community) => (
                                    <div
                                        key={community.name}
                                        onClick={() => navigate(`/r/${community.name}`)}
                                        className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-purple-400 dark:bg-purple-700 border-3 border-black dark:border-gray-500 flex items-center justify-center font-black text-xl text-black dark:text-white">
                                                    {community.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-black dark:text-white">g/{community.name}</h3>
                                                    <p className="text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {(community.members || 0).toLocaleString()} members
                                                    </p>
                                                    <p className="text-gray-800 dark:text-gray-400 mt-1 font-medium">{community.description}</p>
                                                </div>
                                            </div>
                                            <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-bold hover:bg-gray-800 dark:hover:bg-gray-200">
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
