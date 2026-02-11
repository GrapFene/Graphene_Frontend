import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginInit, loginVerify } from '../services/api';
import { hashData, hashMnemonicWord } from '../utils/crypto';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phase, setPhase] = useState<'input' | 'challenge'>('input');
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [loginDid, setLoginDid] = useState('');
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginInit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const passwordHash = hashData(password);
            const result = await loginInit({ username, password_hash: passwordHash });

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
            localStorage.setItem('graphene_user', JSON.stringify(result.identity));

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
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-8 md:p-12">
                <h1 className="text-4xl font-black mb-2 uppercase">
                    GrapFene
                </h1>
                <div className="bg-black text-white inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8">
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
                            className="w-full px-4 py-3 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            placeholder="USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full px-4 py-3 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="w-full bg-yellow-300 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Create Account
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginVerify} className="space-y-4">
                        <p className="bg-purple-400 border-2 border-black p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            Security Check
                        </p>
                        <p className="text-black font-bold text-sm mb-6 border-l-4 border-black pl-4">
                            Enter the requested mnemonic words.
                        </p>

                        {challengeIndices.map((idx, i) => (
                            <div key={idx}>
                                <label className="text-xs font-black uppercase text-black block mb-1 bg-yellow-300 inline-block px-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Word #{idx + 1}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    placeholder={`Type word ${idx + 1}`}
                                    value={challengeWords[i]}
                                    onChange={(e) => updateChallengeWord(i, e.target.value)}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'VERIFY & LOGIN'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPhase('input')}
                            className="w-full bg-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
