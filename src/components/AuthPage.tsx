import React, { useState } from 'react';
import { generateIdentity, hashData, hashMnemonic, generateSalt, hashMnemonicWord } from '../utils/crypto';
import { register, loginInit, loginVerify } from '../services/api';

interface AuthPageProps {
    onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phase, setPhase] = useState<'input' | 'display' | 'challenge'>('input');
    const [identity, setIdentity] = useState<any>(null); // Replace 'any' with proper type if available
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Login state
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [loginDid, setLoginDid] = useState('');

    const resetState = () => {
        setPhase('input');
        setIdentity(null);
        setSalt('');
        setError('');
        setChallengeIndices([]);
        setChallengeWords(['', '', '']);
        setLoginDid('');
    };

    const handleTabChange = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        resetState();
        setUsername('');
        setPassword('');
    };

    // ===== REGISTRATION FLOW =====
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

            alert(`Registration successful! Welcome, ${username}. Please save your mnemonic words!`);
            handleTabChange('login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // ===== LOGIN FLOW =====
    const handleLoginInit = async () => {
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
            setSalt(result.salt); // Store salt for verification
            setPhase('challenge');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginVerify = async () => {
        setLoading(true);
        setError('');

        try {
            // Hash each word with the stored salt (same as registration)
            const wordHashes = challengeWords.map((word, i) =>
                hashMnemonicWord(word.toLowerCase().trim(), salt)
            );

            const result = await loginVerify({
                did: loginDid,
                word_hashes: wordHashes,
                indices: challengeIndices,
            });

            // Store token
            localStorage.setItem('graphene_token', result.token);
            localStorage.setItem('graphene_user', JSON.stringify(result.identity));

            // Call parent callback
            onLoginSuccess();
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
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-yellow-50">
            <div className="neo-panel w-full max-w-lg p-8 md:p-12 text-center relative">

                <h1 className="neo-text-heading mb-2 uppercase italic transform -rotate-2">
                    GrapFene
                </h1>
                <div className="bg-black text-white inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8 transform rotate-1">
                    Federalized Network
                </div>

                {/* Tab Buttons */}
                <div className="flex gap-4 mb-8">
                    <button
                        className={`neo-button ${activeTab === 'login' ? '' : 'neo-button-secondary'}`}
                        onClick={() => handleTabChange('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`neo-button ${activeTab === 'register' ? 'bg-pink-400 hover:bg-pink-300 active:bg-pink-500' : 'neo-button-secondary'}`}
                        onClick={() => handleTabChange('register')}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="neo-warning animate-bounce">
                        {error}
                    </div>
                )}

                {/* ========== REGISTER TAB ========== */}
                {activeTab === 'register' && (
                    <>
                        {phase === 'input' && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-black font-bold text-lg mb-4 text-left border-b-4 border-black pb-2">
                                    Create Identity
                                </p>
                                <input
                                    type="text"
                                    className="neo-input"
                                    placeholder="USERNAME"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="neo-input"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="neo-button bg-green-400 hover:bg-green-300 active:bg-green-500 mt-4"
                                    onClick={handleGenerateIdentity}
                                >
                                    Generate Identity
                                </button>
                            </div>
                        )}

                        {phase === 'display' && identity && (
                            <div className="animate-fadeIn">
                                <p className="bg-green-400 border-2 border-black p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    Identity Generated
                                </p>

                                <div className="neo-warning bg-orange-400">
                                    <strong className="block text-2xl mb-1 upercase">WARNING!</strong>
                                    Save this sequence now. It is lost forever if you proceed without it.
                                </div>

                                <div className="neo-grid">
                                    {identity.mnemonic.split(' ').map((word: string, idx: number) => (
                                        <div key={idx} className="neo-tag">
                                            <span className="opacity-50 mr-1 text-[10px] font-normal">{idx + 1}.</span>
                                            {word}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 text-left bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <label className="text-xs font-black uppercase text-gray-500 block mb-1">Public Key</label>
                                    <div className="text-xs font-mono text-black font-bold break-all">
                                        {identity.address}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-8">
                                    <button
                                        className="neo-button bg-black text-white hover:bg-gray-800 hover:text-white"
                                        onClick={handleRegister}
                                        disabled={loading}
                                    >
                                        {loading ? 'Registering...' : 'I HAVE SAVED IT →'}
                                    </button>

                                    <button
                                        className="neo-button neo-button-secondary"
                                        onClick={() => setPhase('input')}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ========== LOGIN TAB ========== */}
                {activeTab === 'login' && (
                    <>
                        {phase === 'input' && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-black font-bold text-lg mb-4 text-left border-b-4 border-black pb-2">
                                    Welcome Back
                                </p>
                                <input
                                    type="text"
                                    className="neo-input"
                                    placeholder="USERNAME"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="neo-input"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="neo-button mt-4"
                                    onClick={handleLoginInit}
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Continue'}
                                </button>
                            </div>
                        )}

                        {phase === 'challenge' && (
                            <div className="animate-fadeIn">
                                <p className="bg-purple-400 border-2 border-black p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    Security Check
                                </p>
                                <p className="text-black font-bold text-sm mb-6 border-l-4 border-black pl-4 text-left">
                                    Prove you own this identity. Enter the requested mnemonic words.
                                </p>

                                <div className="space-y-4 mb-6">
                                    {challengeIndices.map((idx, i) => (
                                        <div key={idx} className="text-left">
                                            <label className="text-xs font-black uppercase text-black block mb-1 bg-yellow-300 inline-block px-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                Word #{idx + 1}
                                            </label>
                                            <input
                                                type="text"
                                                className="neo-input"
                                                placeholder={`Type word ${idx + 1}`}
                                                value={challengeWords[i]}
                                                onChange={(e) => updateChallengeWord(i, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        className="neo-button bg-black text-white hover:bg-gray-800 hover:text-white"
                                        onClick={handleLoginVerify}
                                        disabled={loading}
                                    >
                                        {loading ? 'Authenticating...' : 'VERIFY & LOGIN'}
                                    </button>

                                    <button
                                        className="neo-button neo-button-secondary"
                                        onClick={() => setPhase('input')}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
