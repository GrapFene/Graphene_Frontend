import { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { hashMnemonicWord } from '../utils/crypto';

interface MnemonicVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (wordHashes: string[], indices: number[]) => Promise<boolean>;
}

/**
 * Mnemonic Verification Modal Component
 * 
 * Functionality: Prompts user to enter 3 random words from their mnemonic phrase for verification.
 * Input: isOpen (boolean) - Whether modal is visible
 *        onClose (function) - Handler to close modal
 *        onVerify (function) - Handler to verify mnemonic words
 * Response: JSX.Element - The rendered modal component.
 */
export default function MnemonicVerificationModal({ isOpen, onClose, onVerify }: MnemonicVerificationModalProps) {
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSalt, setFetchingSalt] = useState(false);

    // Generate 3 random indices and fetch salt when modal opens
    useEffect(() => {
        if (isOpen) {
            // Generate 3 unique random numbers between 0-11
            const indices: number[] = [];
            while (indices.length < 3) {
                const randomIndex = Math.floor(Math.random() * 12);
                if (!indices.includes(randomIndex)) {
                    indices.push(randomIndex);
                }
            }
            indices.sort((a, b) => a - b);
            setChallengeIndices(indices);
            setChallengeWords(['', '', '']);
            setError('');
            
            // Fetch salt from backend
            fetchSaltFromBackend();
        }
    }, [isOpen]);

    const fetchSaltFromBackend = async () => {
        setFetchingSalt(true);
        try {
            const userStr = localStorage.getItem('graphene_user');
            if (!userStr) {
                setError('User not found');
                return;
            }

            const user = JSON.parse(userStr);
            const token = localStorage.getItem('graphene_token');

            // Call backend to get salt (same as loginInit does)
            const response = await fetch('http://localhost:3000/auth/get-salt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ did: user.did })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch salt');
            }

            const data = await response.json();
            setSalt(data.salt);
        } catch (err) {
            console.error('🔴 [MODAL] Failed to fetch salt:', err);
            setError('Failed to initialize verification. Please try again.');
        } finally {
            setFetchingSalt(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userStr = localStorage.getItem('graphene_user');
            if (!userStr) {
                setError('User not found');
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);

            console.log('🔐 [MODAL] Verification Debug:');
            console.log('  - User DID:', user.did);
            console.log('  - Salt (from backend):', salt);
            console.log('  - Challenge Indices:', challengeIndices);
            console.log('  - Challenge Words (raw):', challengeWords);

            // Hash the entered words with the salt FROM BACKEND (same as login!)
            const wordHashes = challengeWords.map((word) =>
                hashMnemonicWord(word.toLowerCase().trim(), salt)
            );

            console.log('  - Word Hashes:', wordHashes);

            const isValid = await onVerify(wordHashes, challengeIndices);
            if (isValid) {
                setChallengeWords(['', '', '']);
                onClose();
            } else {
                setError('Invalid mnemonic words. Please try again.');
            }
        } catch (err) {
            console.error('🔴 [MODAL] Verification error:', err);
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setChallengeWords(['', '', '']);
        setError('');
        onClose();
    };

    const updateChallengeWord = (index: number, value: string) => {
        const newWords = [...challengeWords];
        newWords[index] = value;
        setChallengeWords(newWords);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] max-w-md w-full">
                <div className="bg-purple-400 dark:bg-purple-700 border-b-4 border-black dark:border-gray-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-black dark:text-white" strokeWidth={3} />
                        <h2 className="font-black text-xl text-black dark:text-white uppercase">
                            Security Check
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="hover:bg-black hover:bg-opacity-10 p-1 transition-colors"
                    >
                        <X className="w-6 h-6 text-black dark:text-white" strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fetchingSalt ? (
                        <div className="text-center py-8">
                            <p className="font-bold text-black dark:text-white">Loading challenge...</p>
                        </div>
                    ) : (
                        <>
                            <p className="font-bold text-black dark:text-white border-l-4 border-black dark:border-white pl-4">
                                Enter the requested mnemonic words.
                            </p>

                            {challengeIndices.map((idx, i) => (
                                <div key={idx}>
                                    <label className="text-xs font-black uppercase text-black dark:text-white mb-1 bg-yellow-300 dark:bg-yellow-600 inline-block px-2 border border-black dark:border-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                        Word #{idx + 1}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border-4 border-black dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                                        placeholder={`Type word ${idx + 1}`}
                                        value={challengeWords[i]}
                                        onChange={(e) => updateChallengeWord(i, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}

                            {error && (
                                <div className="bg-red-300 dark:bg-red-900 border-2 border-red-500 p-3 animate-bounce">
                                    <p className="font-bold text-red-700 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || challengeWords.some(w => !w.trim()) || fetchingSalt}
                                className="w-full bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-gray-600 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-600 px-6 py-3 font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] uppercase"
                            >
                                Back
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
