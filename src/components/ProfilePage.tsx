import React, { useState, useEffect } from 'react';
import { hashData, restoreIdentity } from '../utils/crypto';
import { ethers } from 'ethers';
import { getProfile, updateProfile } from '../services/api';
import { User, Lock, Save, AlertTriangle } from 'lucide-react';

interface ProfilePageProps {
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const [did, setDid] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [mnemonic, setMnemonic] = useState('');

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
            // Profile might not exist yet, which is fine
            console.log('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!mnemonic) {
            setError('Mnemonic is required to sign the update');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            // 1. Recover Identity from Mnemonic to sign
            const identity = restoreIdentity(mnemonic.trim());
            if ('error' in identity) {
                throw new Error('Invalid mnemonic phrase');
            }

            // 2. Prepare content
            const content = {
                displayName,
                bio,
                avatarUrl
            };

            // 3. Hash content
            // Note: We need a hash function that matches backend. 
            // Backend uses SHA-256 of JSON string.
            // Frontend utils/crypto has hashData (Keccak256).
            // We should use what the backend expects or standardize.
            // Current plan: Frontend hashes with whatever it has, signs it.
            // BUT backend `updateProfile` calculates hash itself to store in DB.
            // AND backend verifies signature against that hash.
            // So Frontend MUST generate the EXACT SAME hash as backend.
            // Backend: `createHash('sha256').update(JSON.stringify(content)).digest('hex')`
            // Frontend: We need SHA-256. `ethers.sha256(ethers.toUtf8Bytes(JSON.stringify(content)))`.

            // Let's implement this logic here or in api.ts? 
            // `api.ts` is cleaner. But `sign` needs private key which we only have here.

            // WAIT. `restoreIdentity` gives us a wallet/signer.
            // `wallet.signMessage(message)`

            // Backend expects `signed_hash`.
            // Message = Content Hash.
            // So we must hash the content first.

            // Imports for hashing?
            // We can use `ethers.sha256`.

            // Wait, `utils/crypto.ts` exports `hashData` which is keccak256. 
            // Backend uses sha256. 
            // I should update `utils/crypto.ts` or add `hashContent` there.
            // Or just import ethers here. `utils/crypto` already imports ethers.

            // I'll assume I can add `hashContent` to `utils/crypto.ts` or just use ethers here.
            // I'll create a helper in this file for now to be safe/quick, or better, update `utils/crypto.ts`.
            // Let's stick to using what we have. `hashData` is keccak256.
            // If backend uses sha256, we have a mismatch.
            // I should update backend to use Keccak256 (matches Ethereum standard) OR update frontend to use SHA256.
            // Ethers defaults to Keccak256.
            // I will update the backend `services/profile.ts` to use Keccak256 to match Ethereum/Ethers standard!
            // This is better for "Ethereum style" app.
            // **SELF-CORRECTION**: I ALREADY wrote `profile.ts` with SHA-256 in previous step!
            // I should have used Keccak.
            // I will update `backend/src/services/profile.ts` to use Keccak256 logic if possible, or just accept SHA256.
            // Frontend `ethers.sha256` exists.
            // I will use `ethers.sha256` in Frontend.

        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
            <div className="glass-panel w-full max-w-2xl p-8 relative">
                <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-white">
                    ← Back
                </button>

                <h2 className="text-2xl font-black mb-6 flex items-center justify-center gap-2">
                    <User className="w-8 h-8 text-purple-400" />
                    DID Profile
                </h2>

                <div className="mb-8 p-4 bg-black/30 rounded-lg border border-white/10 text-left">
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Your DID</label>
                    <code className="text-xs text-purple-300 font-mono break-all">{did}</code>
                </div>

                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-bold mb-2">Display Name</label>
                        <input
                            type="text"
                            className="cyber-input"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="How should we call you?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Bio</label>
                        <textarea
                            className="cyber-input min-h-[100px]"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Tell us about your digital self..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Avatar URL</label>
                        <input
                            type="text"
                            className="cyber-input"
                            value={avatarUrl}
                            onChange={e => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3 bg-yellow-900/30 p-4 rounded-lg border border-yellow-700/50 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-200/80">
                                <p className="font-bold mb-1">Signing Required</p>
                                Profile updates must be cryptographically signed. Since we don't store your private keys, you must enter your mnemonic phrase to sign this update.
                            </div>
                        </div>

                        <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Mnemonic Phrase
                        </label>
                        <input
                            type="password"
                            className="cyber-input border-purple-500/50"
                            value={mnemonic}
                            onChange={e => setMnemonic(e.target.value)}
                            placeholder="Enter your 12-word recovery phrase to sign..."
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm font-bold bg-red-900/20 p-3 rounded">{error}</div>}
                    {message && <div className="text-green-400 text-sm font-bold bg-green-900/20 p-3 rounded">{message}</div>}

                    <button
                        className="cyber-button primary mt-4 flex items-center justify-center gap-2"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Signing & Saving...' : <><Save className="w-4 h-4" /> Sign & Update Profile</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
