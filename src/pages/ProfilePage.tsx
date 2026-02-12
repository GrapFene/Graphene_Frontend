import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProfile,
    updateProfile,
    loginInit,
    getGuardians,
    setGuardians,
    Guardian,
    getPendingRecoveryRequests,
    approveRecovery,
    RecoveryRequestInfo
} from '../services/api';
import { hashData, hashMnemonicWord } from '../utils/crypto';
import { ethers } from 'ethers';
import Header from '../components/Header';
import { User, Lock, Save, AlertTriangle, ArrowLeft, Shield, Plus, X, HandHeart } from 'lucide-react';

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

    // Guardian State
    const [guardians, setGuardiansList] = useState<Guardian[]>([]);
    const [newGuardianId, setNewGuardianId] = useState('');
    const [showGuardians, setShowGuardians] = useState(false);

    // Guardian Duties State
    const [pendingRequests, setPendingRequests] = useState<RecoveryRequestInfo[]>([]);
    const [showDuties, setShowDuties] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('graphene_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setDid(user.did);
            setUsername(user.username);

            // Initial Load
            loadProfile(user.did);
            loadGuardians();
            loadPendingRequests();
        }
    }, []);

    const loadGuardians = async () => {
        try {
            const data = await getGuardians();
            setGuardiansList(data.my_guardians);
        } catch (err) {
            console.error('Failed to load guardians', err);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const data = await getPendingRecoveryRequests();
            setPendingRequests(data);
        } catch (err) {
            console.error('Failed to load pending requests', err);
        }
    };

    const handleAddGuardian = async () => {
        if (!newGuardianId) return;
        setLoading(true);
        try {
            let targetDid = newGuardianId;
            if (!targetDid.startsWith('did:')) {
                // Assume it's a username and format it
                targetDid = `did:graphene:${newGuardianId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            }

            const currentDids = guardians.map(g => g.did);
            if (currentDids.includes(targetDid)) {
                throw new Error('User is already a guardian');
            }

            const newDids = [...currentDids, targetDid];
            await setGuardians(newDids);

            setNewGuardianId('');
            await loadGuardians();
            setMessage('Guardian added successfully');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error?.message || err.message || 'Failed to add guardian';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveGuardian = async (guardianDid: string) => {
        if (!confirm('Are you sure you want to remove this guardian?')) return;
        setLoading(true);
        try {
            const newDids = guardians.filter(g => g.did !== guardianDid).map(g => g.did);
            await setGuardians(newDids);
            await loadGuardians();
            setMessage('Guardian removed');
        } catch (err: any) {
            setError(err.message || 'Failed to remove guardian');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRecovery = async (requestId: string) => {
        if (!confirm('Are you sure you want to approve this account recovery? This will help the user replace their keys.')) return;

        setLoading(true);
        try {
            await approveRecovery(requestId);
            setMessage('Recovery request approved');
            await loadPendingRequests();
        } catch (err: any) {
            setError(err.message || 'Failed to approve recovery');
        } finally {
            setLoading(false);
        }
    };

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

            // Create a nonce
            const nonce = Date.now().toString();

            // Create a simple signature (in production, this would be done with the verified identity)
            const contentHash = ethers.sha256(ethers.toUtf8Bytes(JSON.stringify(content)));

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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 pb-12">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guardians Section */}
                            <div className="bg-blue-100 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <Shield className="w-6 h-6" />
                                        Account Guardians
                                    </h3>
                                    <button
                                        onClick={() => setShowGuardians(!showGuardians)}
                                        className="text-sm font-bold underline"
                                    >
                                        {showGuardians ? 'Hide' : 'Manage'}
                                    </button>
                                </div>

                                {showGuardians && (
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold">
                                            Guardians can help you recover your account if you lose access.
                                            Add trusted friends.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 border-4 border-black font-bold focus:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                placeholder="Enter Username or DID"
                                                value={newGuardianId}
                                                onChange={e => setNewGuardianId(e.target.value)}
                                            />
                                            <button
                                                onClick={handleAddGuardian}
                                                disabled={loading}
                                                className="bg-black text-white px-4 py-2 font-black border-4 border-black hover:bg-gray-800"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                                            {guardians.map(g => (
                                                <div key={g.did} className="flex items-center justify-between bg-white border-2 border-black p-2">
                                                    <div>
                                                        <p className="font-bold text-sm">{g.username || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{g.did.substring(0, 10)}...</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveGuardian(g.did)}
                                                        className="text-red-500 hover:bg-red-100 p-1 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {guardians.length === 0 && (
                                                <p className="text-sm text-gray-500 italic">No guardians set.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Guardian Duties Section */}
                            <div className="bg-red-100 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <HandHeart className="w-6 h-6" />
                                        Guardian Duties
                                    </h3>
                                    <button
                                        onClick={() => setShowDuties(!showDuties)}
                                        className="text-sm font-bold underline"
                                    >
                                        {showDuties ? 'Hide' : 'Check'}
                                    </button>
                                </div>

                                {showDuties && (
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold">
                                            Requests from users who have trusted you as their guardian.
                                        </p>

                                        <div className="space-y-2 mt-4">
                                            {pendingRequests.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">No pending requests.</p>
                                            ) : (
                                                pendingRequests.map(req => (
                                                    <div key={req.id} className="bg-white border-2 border-black p-2">
                                                        <div className="mb-2">
                                                            <p className="font-bold text-sm">Recovery for: {req.target_username}</p>
                                                            <p className="text-xs text-gray-500">Approvals: {req.approvals} / {req.required_approvals}</p>
                                                        </div>
                                                        {req.has_approved ? (
                                                            <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 text-center border border-green-500">
                                                                Approved
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleApproveRecovery(req.id)}
                                                                disabled={loading}
                                                                className="w-full bg-black text-white text-xs font-bold py-1 hover:opacity-80 disabled:opacity-50"
                                                            >
                                                                APPROVE RECOVERY
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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
