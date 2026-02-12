import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { generateIdentity, hashData, hashMnemonic, generateSalt } from '../utils/crypto';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phase, setPhase] = useState<'input' | 'display'>('input');
    const [identity, setIdentity] = useState<any>(null);
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerateIdentity = () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }
        setError('');
        const id = generateIdentity();
        const newSalt = generateSalt();
        setIdentity(id);
        setSalt(newSalt);
        setPhase('display');
    };

    const handleRegister = async () => {
        if (!identity) return;
        setLoading(true);
        setError('');

        try {
            const passwordHash = hashData(password);
            const mnemonicHashes = hashMnemonic(identity.mnemonic, salt);

            await register({
                username,
                password_hash: passwordHash,
                salt,
                public_key: identity.address,
                mnemonic_hashes: mnemonicHashes,
            });

            alert(`Registration successful! Welcome, ${username}.`);
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] w-full max-w-lg p-8 md:p-12 transition-colors">
                <h1 className="text-4xl font-black mb-2 uppercase text-black dark:text-white">
                    GrapFene
                </h1>
                <div className="bg-black dark:bg-white text-white dark:text-black inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                    Register
                </div>

                {error && (
                    <div className="bg-red-300 border-4 border-black p-3 font-bold mb-4 animate-bounce">
                        {error}
                    </div>
                )}

                {phase === 'input' ? (
                    <div className="space-y-4">
                        <input
                            type="text"
                            className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            placeholder="USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={handleGenerateIdentity}
                            className="w-full bg-green-400 dark:bg-green-700 border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
                        >
                            Generate Identity
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                        >
                            Already have an account? Login
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="bg-green-400 dark:bg-green-700 border-2 border-black dark:border-gray-500 p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white">
                            Identity Generated
                        </p>

                        <div className="bg-orange-400 dark:bg-orange-600 border-4 border-black dark:border-gray-500 p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                            <strong className="block text-2xl mb-1 font-black uppercase text-black dark:text-white">WARNING!</strong>
                            <p className="font-bold text-black dark:text-white">Save this sequence now. It is lost forever if you proceed without it.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {identity.mnemonic.split(' ').map((word: string, idx: number) => (
                                <div key={idx} className="bg-yellow-300 dark:bg-yellow-600 border-3 border-black dark:border-gray-500 p-2 font-black text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white">
                                    <span className="opacity-50 mr-1 text-[10px] font-normal">{idx + 1}.</span>
                                    {word}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-white dark:bg-gray-700 border-2 border-black dark:border-gray-500 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] mb-6">
                            <label className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 block mb-1">Public Key</label>
                            <div className="text-xs font-mono text-black dark:text-white font-bold break-all">
                                {identity.address}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="w-full bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50"
                            >
                                {loading ? 'Registering...' : 'I HAVE SAVED IT →'}
                            </button>
                            <button
                                onClick={() => setPhase('input')}
                                className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
