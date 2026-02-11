import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getProfile, updateProfile, loginInit } from '../services/api';
import { hashData, hashMnemonicWord } from '../utils/crypto';
import { ethers } from 'ethers';
import Header from '../components/Header';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [did, setDid] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Challenge state
    const [phase, setPhase] = useState<'edit' | 'challenge'>('edit');
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [salt, setSalt] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('graphene_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setDid(user.did);
            setUsername(user.username);
            loadProfile(user.did);
        }
    }, []);

    const loadProfile = async (userDid: string) => {
        try {
            setLoading(true);
            const profile = await getProfile(userDid);
            if (profile && profile.content) {
                setDisplayName(profile.content.displayName || '');
                setBio(profile.content.bio || '');
                setAvatarUrl(profile.content.avatarUrl || '');
            }
        } catch (err) {
            console.log('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const passwordHash = hashData(password);
            const result = await loginInit({ username, password_hash: passwordHash });

            setChallengeIndices(result.challenge_indices);
            setSalt(result.salt);
            setPhase('challenge');
        } catch (err: any) {
            setError(err.message || 'Failed to get challenge');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Hash the challenge words with salt
            const wordHashes = challengeWords.map((word) =>
                hashMnemonicWord(word.toLowerCase().trim(), salt)
            );

            // Prepare profile content
            const content = { displayName, bio, avatarUrl };

            // For now, we'll use a simplified approach
            // In production, you'd want to verify the mnemonic words on backend
            // and then allow the profile update

            // Create a nonce
            const nonce = Date.now().toString();

            // Create a simple signature (in production, this would be done with the verified identity)
            const contentHash = ethers.sha256(ethers.toUtf8Bytes(JSON.stringify(content)));

            // For MVP: We'll send the word hashes as verification
            // Backend should verify these match before allowing update
            await updateProfile({
                did,
                content,
                nonce,
                signed_hash: contentHash, // Simplified for MVP
                word_hashes: wordHashes,
                indices: challengeIndices
            });

            setMessage('Profile updated successfully!');
            setPassword('');
            setChallengeWords(['', '', '']);
            setPhase('edit');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const updateChallengeWord = (index: number, value: string) => {
        const newWords = [...challengeWords];
        newWords[index] = value;
        setChallengeWords(newWords);
    };

    const handleLogout = () => {
        localStorage.removeItem('graphene_token');
        localStorage.removeItem('graphene_user');

        // Trigger auth state update
        window.dispatchEvent(new Event('authChange'));

        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
            <Header onCreatePost={() => navigate('/submit')} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                    Back to Feed
                </button>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="bg-purple-400 border-b-4 border-black p-6">
                        <h2 className="text-3xl font-black flex items-center gap-3">
                            <User className="w-8 h-8" strokeWidth={3} />
                            Profile Settings
                        </h2>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* DID Display */}
                        <div className="bg-gray-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <label className="text-xs font-black uppercase text-gray-600 block mb-2">Your DID</label>
                            <code className="text-sm font-mono font-bold break-all">{did}</code>
                        </div>

                        <div className="bg-gray-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <label className="text-xs font-black uppercase text-gray-600 block mb-2">Username</label>
                            <p className="text-lg font-black">{username}</p>
                        </div>

                        {phase === 'edit' ? (
                            <form onSubmit={handleRequestChallenge} className="space-y-6">
                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-black mb-2 uppercase">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="How should we call you?"
                                    />
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-black mb-2 uppercase">Bio</label>
                                    <textarea
                                        className="w-full px-4 py-3 border-4 border-black font-medium focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                    />
                                </div>

                                {/* Avatar URL */}
                                <div>
                                    <label className="block text-sm font-black mb-2 uppercase">Avatar URL</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>

                                {/* Verification Section */}
                                <div className="border-t-4 border-black pt-6 mt-6">
                                    <div className="bg-yellow-100 border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} />
                                            <div className="text-sm font-bold">
                                                <p className="font-black mb-1">Verification Required</p>
                                                To update your profile, you'll need to verify your identity with your password and a few mnemonic words.
                                            </div>
                                        </div>
                                    </div>

                                    <label className="block text-sm font-black mb-2 flex items-center gap-2 uppercase">
                                        <Lock className="w-4 h-4" strokeWidth={3} />
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                {/* Messages */}
                                {error && (
                                    <div className="bg-red-300 border-4 border-black p-4 font-bold animate-bounce">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div className="bg-green-300 border-4 border-black p-4 font-bold">
                                        {message}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Continue to Verification'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="bg-red-400 border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <p className="bg-purple-400 border-2 border-black p-2 font-black text-lg mb-4 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    Security Check
                                </p>
                                <p className="text-black font-bold text-sm mb-6 border-l-4 border-black pl-4">
                                    Enter the requested mnemonic words to verify your identity.
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
                                            required
                                        />
                                    </div>
                                ))}

                                {error && (
                                    <div className="bg-red-300 border-4 border-black p-4 font-bold animate-bounce">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Saving...' : (
                                            <>
                                                <Save className="w-4 h-4" strokeWidth={3} />
                                                Verify & Update Profile
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhase('edit');
                                            setChallengeWords(['', '', '']);
                                            setError('');
                                        }}
                                        className="bg-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        Back
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
