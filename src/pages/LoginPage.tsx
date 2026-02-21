import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginInit, loginVerify } from '../services/api';
import { hashMnemonicWord } from '../utils/crypto';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Login Page Component
 * 
 * Functionality: Handles user authentication via username and mnemonic verification.
 * Input: None
 * Response: JSX.Element - The rendered login page.
 */
export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    // Password state removed
    const [phase, setPhase] = useState<'input' | 'challenge'>('input');
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [loginDid, setLoginDid] = useState('');
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginInit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Please enter username');
            return;
        }
        setLoading(true);
        setError('');

        try {
            // Password logic removed
            const result = await loginInit({ username });

            setChallengeIndices(result.challenge_indices);
            setLoginDid(result.did);
            setSalt(result.salt);
            setPhase('challenge');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const wordHashes = challengeWords.map((word) =>
                hashMnemonicWord(word.toLowerCase().trim(), salt)
            );

            const result = await loginVerify({
                did: loginDid,
                word_hashes: wordHashes,
                indices: challengeIndices,
            });

            localStorage.setItem('graphene_token', result.token);
            localStorage.setItem('graphene_user', JSON.stringify({ 
                ...result.identity, 
                salt: salt  // ✅ STORE THE SALT!
            }));

            // Trigger auth state update
            window.dispatchEvent(new Event('authChange'));

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const updateChallengeWord = (index: number, value: string) => {
        const newWords = [...challengeWords];
        newWords[index] = value;
        setChallengeWords(newWords);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] w-full max-w-lg p-8 md:p-12 transition-colors">
                <h1 className="text-4xl font-black mb-2 uppercase text-black dark:text-white">
                    GrapFene
                </h1>
                <div className="bg-black dark:bg-white text-white dark:text-black inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                    Login
                </div>

                {error && (
                    <div className="bg-red-300 border-4 border-black p-3 font-bold mb-4 animate-bounce">
                        {error}
                    </div>
                )}

                {phase === 'input' ? (
                    <form onSubmit={handleLoginInit} className="space-y-4">
                        <input
                            type="text"
                            className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            placeholder="USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        {/* Password Input Removed */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size={20} className="text-white dark:text-black" />
                                    <span>Please wait...</span>
                                </>
                            ) : (
                                'Continue'
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/recovery')}
                                className="text-sm font-bold underline hover:text-blue-600"
                            >
                                Forgot Password? / Recover Account
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="w-full bg-yellow-300 dark:bg-yellow-600 border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
                        >
                            Create Account
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginVerify} className="space-y-4">
                        <p className="bg-purple-400 dark:bg-purple-700 border-2 border-black dark:border-gray-500 p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white">
                            Security Check
                        </p>
                        <p className="text-black dark:text-white font-bold text-sm mb-6 border-l-4 border-black dark:border-white pl-4">
                            Enter the requested mnemonic words.
                        </p>

                        {challengeIndices.map((idx, i) => (
                            <div key={idx}>
                                <label className="text-xs font-black uppercase text-black dark:text-white mb-1 bg-yellow-300 dark:bg-yellow-600 inline-block px-2 border border-black dark:border-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    Word #{idx + 1}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                                    placeholder={`Type word ${idx + 1}`}
                                    value={challengeWords[i]}
                                    onChange={(e) => updateChallengeWord(i, e.target.value)}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size={20} className="text-white dark:text-black" />
                                    <span>Please wait...</span>
                                </>
                            ) : (
                                'VERIFY & LOGIN'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPhase('input')}
                            className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
