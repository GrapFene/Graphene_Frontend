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
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-8 md:p-12">
                <h1 className="text-4xl font-black mb-2 uppercase">
                    GrapFene
                </h1>
                <div className="bg-black text-white inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8">
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
                            onClick={handleGenerateIdentity}
                            className="w-full bg-green-400 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Generate Identity
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Already have an account? Login
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="bg-green-400 border-2 border-black p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            Identity Generated
                        </p>

                        <div className="bg-orange-400 border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <strong className="block text-2xl mb-1 font-black uppercase">WARNING!</strong>
                            <p className="font-bold">Save this sequence now. It is lost forever if you proceed without it.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {identity.mnemonic.split(' ').map((word: string, idx: number) => (
                                <div key={idx} className="bg-yellow-300 border-3 border-black p-2 font-black text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="opacity-50 mr-1 text-[10px] font-normal">{idx + 1}.</span>
                                    {word}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
                            <label className="text-xs font-black uppercase text-gray-500 block mb-1">Public Key</label>
                            <div className="text-xs font-mono text-black font-bold break-all">
                                {identity.address}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="w-full bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50"
                            >
                                {loading ? 'Registering...' : 'I HAVE SAVED IT →'}
                            </button>
                            <button
                                onClick={() => setPhase('input')}
                                className="w-full bg-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
