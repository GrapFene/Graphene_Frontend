import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateIdentity, generateSalt, hashMnemonic } from '../utils/crypto';
import { initiateRecovery, finalizeRecovery } from '../services/api';

/**
 * Recovery Page Component
 * 
 * Functionality: Handles account recovery process, including identity generation and guardian approval flow.
 * Input: None
 * Response: JSX.Element - The rendered recovery page.
 */
export default function RecoveryPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Recovery State
    const [phase, setPhase] = useState<'input' | 'generate' | 'status' | 'finalize'>('input');
    const [newIdentity, setNewIdentity] = useState<any>(null);
    // Password state removed
    const [requestId, setRequestId] = useState('');
    const [finalizeRequestId, setFinalizeRequestId] = useState('');

    const deriveDid = (username: string) => {
        return `did:graphene:${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }
        setError('');

        // Generate new identity
        const identity = generateIdentity();
        setNewIdentity(identity);
        setPhase('generate');
    };

    const handleSubmitRecovery = async () => {
        if (!newIdentity) {
            setError('Please ensure identity is generated');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const salt = generateSalt();
            // Password hash removed
            const mnemonicHashes = hashMnemonic(newIdentity.mnemonic, salt);
            const targetDid = deriveDid(username);

            const result = await initiateRecovery({
                target_did: targetDid,
                // No password hash sent
                new_salt: salt,
                new_mnemonic_hashes: mnemonicHashes
            });

            setRequestId(result.request_id);
            setPhase('status');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message || 'Failed to initiate recovery');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!finalizeRequestId.trim()) {
            setError('Please enter a Request ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await finalizeRecovery(finalizeRequestId);
            alert('Recovery finalized! You can now login with your new credentials.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message || 'Failed to finalize recovery');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadIdentity = () => {
        if (!newIdentity || !username) return;

        // 1. Split the mnemonic string by spaces into an array of words
        const words = newIdentity.mnemonic.split(' ');

        // 2. Map each word to "Number. Word" format and join with new lines
        const formattedContent = words
            .map((word: string, index: number) => `${index + 1}. ${word}`)
            .join('\n');

        const element = document.createElement("a");
        // 3. Create the Blob using the formatted content
        const file = new Blob([formattedContent], { type: 'text/plain' });

        element.href = URL.createObjectURL(file);
        element.download = `recovery_${username}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] w-full max-w-lg p-8 md:p-12 transition-colors">
                <h1 className="text-4xl font-black mb-2 uppercase text-black dark:text-white">
                    GrapFene
                </h1>
                <div className="bg-red-500 text-white inline-block px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-8 border-2 border-black dark:border-gray-600">
                    Account Recovery
                </div>



                {error && (
                    <div className="bg-red-300 border-4 border-black p-3 font-bold mb-4 animate-bounce">
                        {error}
                    </div>
                )}

                {phase === 'input' && (
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <p className="text-black dark:text-white font-bold text-sm border-l-4 border-black dark:border-gray-500 pl-4">
                            Lost access? Enter your username to start the recovery process.
                            You will need to reach out to your guardians.
                        </p>

                        <input
                            type="text"
                            className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            placeholder="USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />

                        <div className="flex gap-4 flex-col">
                            <button
                                type="submit"
                                className="w-full bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                            >
                                START RECOVERY
                            </button>

                            <button
                                type="button"
                                onClick={() => setPhase('finalize')}
                                className="w-full bg-yellow-300 dark:bg-yellow-600 border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-black dark:text-white"
                            >
                                I HAVE A REQUEST ID
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            >
                                CANCEL
                            </button>
                        </div>
                    </form>
                )}

                {phase === 'generate' && newIdentity && (
                    <div className="space-y-6">
                        <div className="bg-orange-400 dark:bg-orange-600 border-4 border-black dark:border-gray-500 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                            <strong className="block text-xl mb-2 font-black uppercase text-black dark:text-white">Create New Credentials</strong>
                            <p className="font-bold text-sm text-black dark:text-white">
                                Since you lost your keys, we need to generate new ones.
                                <br /><br />
                                <span className="underline">SAVE THIS INFORMATION.</span>
                                It will replace your old login once approved.
                            </p>
                        </div>

                        {/* Mnemonic Display */}
                        <div>
                            <label className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 block mb-1">New Mnemonic (Save this!)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {newIdentity.mnemonic.split(' ').map((word: string, idx: number) => (
                                    <div key={idx} className="bg-yellow-300 dark:bg-yellow-600 border-2 border-black dark:border-gray-500 p-2 font-bold text-xs text-center text-black dark:text-white">
                                        {idx + 1}. {word}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* New Password Input Removed */}

                        <button
                            onClick={handleDownloadIdentity}
                            className="w-full bg-blue-500 hover:bg-blue-400 text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                        >
                            ⬇ DOWNLOAD NEW ACCESS KEY
                        </button>

                        <button
                            onClick={handleSubmitRecovery}
                            disabled={loading}
                            className="w-full bg-green-500 text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                        >
                            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                        </button>
                    </div>
                )}

                {phase === 'status' && (
                    <div className="space-y-6 text-center">
                        <div className="bg-green-300 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-2xl font-black mb-4">Request Initiated!</h3>
                            <p className="font-bold mb-4">
                                Share this Request ID with your guardians. They need to approve it from their profile.
                            </p>
                            <div className="bg-white border-2 border-black p-3 font-mono font-bold break-all select-all">
                                {requestId}
                            </div>
                        </div>

                        <p className="text-sm font-bold">
                            Once your guardians have approved, use the "I Have a Request ID" button on the main recovery page to finalize.
                        </p>

                        <button
                            onClick={() => {
                                setPhase('input');
                                setUsername('');
                                setRequestId('');
                                setNewIdentity(null);
                            }}
                            className="w-full bg-black text-white border-4 border-black px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
                        >
                            DONE
                        </button>
                    </div>
                )}

                {phase === 'finalize' && (
                    <form onSubmit={handleFinalize} className="space-y-6">
                        <p className="text-black dark:text-white font-bold text-sm border-l-4 border-black dark:border-gray-500 pl-4">
                            Enter your Request ID to finalize account recovery.
                            This requires enough guardian approvals.
                        </p>

                        <input
                            type="text"
                            className="w-full px-4 py-3 border-4 border-black dark:border-gray-500 bg-white dark:bg-gray-700 text-black dark:text-white font-bold placeholder:text-gray-400 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                            placeholder="REQUEST ID"
                            value={finalizeRequestId}
                            onChange={(e) => setFinalizeRequestId(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-500 dark:bg-green-700 text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] disabled:opacity-50"
                        >
                            {loading ? 'FINALIZING...' : 'FINALIZE RECOVERY'}
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
        </div >
    );
}

