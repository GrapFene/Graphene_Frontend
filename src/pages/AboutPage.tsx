import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Github } from 'lucide-react';

/**
 * About Page Component
 * 
 * Functionality: Displays information about the Graphene platform and the development team.
 * Input: None
 * Response: JSX.Element - The rendered about page with developer cards.
 */

interface Developer {
    name: string;
    username: string;
    color: string;
}

const developers: Developer[] = [
    { name: 'Karthik Vishal', username: 'karthikvishal-s', color: 'bg-yellow-400' },
    { name: 'Karthik G', username: 'jrgkog', color: 'bg-cyan-400' },
    { name: 'Jai Simha', username: 'jaisimha18', color: 'bg-green-400' },
    { name: 'Nirvesh Singh', username: 'nirvesh3515', color: 'bg-pink-400' },
];

export default function AboutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-700 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] p-8 md:p-12 mb-12">
                    <h1 className="text-5xl md:text-6xl font-black mb-6 text-black dark:text-white leading-tight">
                        About Graphene
                    </h1>
                    <div className="space-y-4 text-lg font-bold text-gray-800 dark:text-gray-300">
                        <p>
                            <span className="bg-yellow-300 dark:bg-yellow-600 border-2 border-black dark:border-gray-700 px-2 py-1 font-black text-black">Graphene</span> is a <span className="font-black text-black dark:text-white">federated, decentralized social network</span> that prioritizes user sovereignty and freedom.
                        </p>
                        <p>
                            Built with modern web technologies, Graphene combines <span className="font-black text-black dark:text-white">blockchain-inspired authentication</span> with traditional social networking features to create a truly <span className="font-black text-black dark:text-white">user-owned platform</span>.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-300 dark:bg-green-700 border-4 border-black dark:border-gray-800 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                            <h3 className="font-black text-2xl mb-2 text-black dark:text-white">🔐 Sovereign Identity</h3>
                            <p className="font-bold text-black dark:text-gray-200">Own your identity through cryptographic keys. No platform lock-in.</p>
                        </div>
                        <div className="bg-pink-300 dark:bg-pink-700 border-4 border-black dark:border-gray-800 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                            <h3 className="font-black text-2xl mb-2 text-black dark:text-white">🌍 Federation</h3>
                            <p className="font-bold text-black dark:text-gray-200">Connect across instances. Communicate freely without borders.</p>
                        </div>
                        <div className="bg-cyan-300 dark:bg-cyan-700 border-4 border-black dark:border-gray-800 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                            <h3 className="font-black text-2xl mb-2 text-black dark:text-white">⚖️ Community Governance</h3>
                            <p className="font-bold text-black dark:text-gray-200">Communities self-govern through proposals and voting.</p>
                        </div>
                    </div>
                </div>

                {/* Developer Team Section */}
                <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-700 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] p-8 md:p-12">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 text-black dark:text-white text-center">
                        Developer Team
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {developers.map((dev) => (
                            <div
                                key={dev.username}
                                className="bg-white dark:bg-gray-900 border-4 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.15)] hover:-translate-y-1 transition-all duration-200 p-6"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`${dev.color} border-4 border-black dark:border-gray-700 w-16 h-16 flex items-center justify-center font-black text-3xl text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                                        {dev.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-black dark:text-white">
                                            {dev.name}
                                        </h3>
                                    </div>
                                </div>

                                <a
                                    href={`https://github.com/${dev.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-700 px-4 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] w-full justify-center"
                                >
                                    <Github className="w-5 h-5" strokeWidth={3} />
                                    <span>@{dev.username}</span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-gray-700 px-8 py-4 font-black text-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]"
                    >
                        ← Back to Home
                    </button>
                </div>
            </main>
        </div>
    );
}
