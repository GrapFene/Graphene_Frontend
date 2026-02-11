
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Check, Key } from 'lucide-react';
import { initiateRecovery, getPendingRecoveryRequests, approveRecovery, finalizeRecovery, RecoveryRequestInfo } from '../services/api';
import { generateIdentity, hashMnemonic, generateSalt, hashData } from '../utils/crypto';
import Header from '../components/Header';

export default function RecoveryPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'initiate' | 'portal'>('initiate');

    // Initiate State
    const [targetUsername, setTargetUsername] = useState('');
    const [newMnemonic, setNewMnemonic] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);

    // Portal State
    const [pendingRequests, setPendingRequests] = useState<RecoveryRequestInfo[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // If logged in, maybe show portal by default?
        const token = localStorage.getItem('graphene_token');
        if (token) {
            setMode('portal');
            loadRequests();
        }
    }, []);

    const loadRequests = async () => {
        try {
            const reqs = await getPendingRecoveryRequests();
            setPendingRequests(reqs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateIdentity = () => {
        const id = generateIdentity();
        setNewMnemonic(id.mnemonic || '');
        setStep(2);
    };

    const handleSubmitRecovery = async () => {
        if (!newPassword || !targetUsername) {
            setError('All fields are required');
            return;
        }
        setLoading(true);
        setError('');

        try {
            // 1. Prepare new credentials
            const salt = generateSalt(); // You need to export generateSalt from utils/crypto or implement it
            const passwordHash = hashData(newPassword); // Requires hashData
            const mnemonicHashes = hashMnemonic(newMnemonic, salt); // Requires hashMnemonic

            // 2. Derive DID from username (simple format)
            const targetDid = `did:graphene:${targetUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            // 3. Submit
            await initiateRecovery({
                target_did: targetDid,
                new_password_hash: passwordHash,
                new_salt: salt,
                new_mnemonic_hashes: mnemonicHashes
            });

            setMessage('Recovery request submitted! Ask your guardians to approve it.');
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Failed to submit recovery request');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reqId: string) => {
        setLoading(true);
        try {
            await approveRecovery(reqId);
            await loadRequests(); // Refresh
            setMessage('Approved successfully');
        } catch (err: any) {
            setError(err.message || 'Failed to approve');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (reqId: string) => {
        setLoading(true);
        try {
            await finalizeRecovery(reqId);
            await loadRequests();
            setMessage('Recovery Finalized! Keys rotated.');
        } catch (err: any) {
            setError(err.message || 'Failed to finalize');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100">
            <Header onCreatePost={() => { }} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                    Back
                </button>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex border-b-4 border-black">
                        <button
                            className={`flex-1 p-4 font-black text-lg ${mode === 'initiate' ? 'bg-red-400' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => setMode('initiate')}
                        >
                            I Lost My Account
                        </button>
                        <button
                            className={`flex-1 p-4 font-black text-lg ${mode === 'portal' ? 'bg-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => { setMode('portal'); loadRequests(); }}
                        >
                            Guardian Portal
                        </button>
                    </div>

                    <div className="p-8">
                        {mode === 'initiate' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-black">Account Recovery</h1>
                                <p className="font-bold">If you lost your credentials, you can request a reset if you have setup Guardians.</p>

                                {step === 1 && (
                                    <div className="space-y-4">
                                        <label className="block font-black uppercase">Username to Recover</label>
                                        <input
                                            className="w-full border-4 border-black p-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                            value={targetUsername}
                                            onChange={e => setTargetUsername(e.target.value)}
                                            placeholder="Enter your username"
                                        />
                                        <button
                                            onClick={handleGenerateIdentity}
                                            disabled={!targetUsername}
                                            className="bg-black text-white px-6 py-3 font-black border-4 border-black hover:bg-gray-800 w-full"
                                        >
                                            Next: Generate New Keys
                                        </button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="bg-yellow-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <h3 className="font-black flex items-center gap-2 text-xl mb-2">
                                                <Key className="w-6 h-6" /> SAVE THIS NEW MNEMONIC!
                                            </h3>
                                            <p className="font-mono bg-white p-3 border-2 border-black mb-2">{newMnemonic}</p>
                                            <p className="text-sm font-bold text-red-600">This is your NEW identity. Write it down.</p>
                                        </div>

                                        <div>
                                            <label className="block font-black uppercase mb-2">Set New Password</label>
                                            <input
                                                type="password"
                                                className="w-full border-4 border-black p-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSubmitRecovery}
                                            disabled={loading}
                                            className="bg-black text-white px-6 py-3 font-black border-4 border-black hover:bg-gray-800 w-full"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Recovery Request'}
                                        </button>
                                        {error && <p className="text-red-500 font-black bg-red-100 p-2 border-2 border-red-500">{error}</p>}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="bg-green-100 p-6 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Check className="w-16 h-16 mx-auto mb-4 text-green-600" />
                                        <h3 className="text-2xl font-black mb-2">Request Submitted!</h3>
                                        <p className="font-bold">Now contact your Guardians and ask them to approve the request for user: {targetUsername}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'portal' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-black flex items-center gap-3">
                                    <Shield className="w-8 h-8" />
                                    Guardian Portal
                                </h1>
                                <p className="font-bold">Review recovery requests for accounts you guard.</p>

                                {pendingRequests.length === 0 ? (
                                    <p className="text-gray-500 italic">No pending requests.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <span className="bg-red-500 text-white px-2 py-1 text-xs font-black uppercase border-2 border-black">Recovery Request</span>
                                                        <h3 className="text-xl font-black mt-2">Recover: {req.target_username}</h3>
                                                        <p className="font-mono text-xs text-gray-500">DID: {req.target_did}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-2xl">{req.approvals} / {req.required_approvals}</p>
                                                        <p className="text-xs font-bold uppercase text-gray-500">Approvals</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {!req.has_approved ? (
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={loading}
                                                            className="flex-1 bg-green-400 border-4 border-black py-2 font-black hover:bg-green-500"
                                                        >
                                                            APPROVE REQUEST
                                                        </button>
                                                    ) : (
                                                        <button disabled className="flex-1 bg-gray-200 border-4 border-black py-2 font-black text-gray-500">
                                                            ALREADY APPROVED
                                                        </button>
                                                    )}

                                                    {req.approvals >= req.required_approvals && (
                                                        <button
                                                            onClick={() => handleFinalize(req.id)}
                                                            disabled={loading}
                                                            className="flex-1 bg-black text-white border-4 border-black py-2 font-black hover:bg-gray-800 animate-pulse"
                                                        >
                                                            FINALIZE RECOVERY
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {message && <p className="text-green-600 font-black bg-green-100 p-2 border-2 border-green-600">{message}</p>}
                                {error && <p className="text-red-500 font-black bg-red-100 p-2 border-2 border-red-500">{error}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
