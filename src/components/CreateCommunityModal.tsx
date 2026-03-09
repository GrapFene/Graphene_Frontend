import { useState } from 'react';
import { X, Globe, Server } from 'lucide-react';
import { communityTopics, CommunityTopic } from '../data/communityTopics';
import { createCommunity } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type Step = 'topic' | 'privacy' | 'hosting' | 'details';

/**
 * Create Community Modal Component
 *
 * Functionality: Multi-step form to create a new community.
 * Steps: topic → privacy → hosting (main server vs own server) → details
 */
export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('topic');
    const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [hostingMode, setHostingMode] = useState<'main' | 'own'>('main');
    const [peerDomain, setPeerDomain] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        setCurrentStep('topic');
        setSelectedTopic(null);
        setIsPrivate(false);
        setHostingMode('main');
        setPeerDomain('');
        setName('');
        setDescription('');
        setError('');
        onClose();
    };

    const handleNext = () => {
        if (currentStep === 'topic' && selectedTopic) setCurrentStep('privacy');
        else if (currentStep === 'privacy') setCurrentStep('hosting');
        else if (currentStep === 'hosting') {
            if (hostingMode === 'own' && !peerDomain.trim()) {
                setError('Please enter your server IP or domain');
                return;
            }
            setError('');
            setCurrentStep('details');
        }
    };

    const handleBack = () => {
        if (currentStep === 'privacy') setCurrentStep('topic');
        else if (currentStep === 'hosting') setCurrentStep('privacy');
        else if (currentStep === 'details') setCurrentStep('hosting');
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Community name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createCommunity(
                name.trim(),
                description.trim(),
                selectedTopic?.id,
                isPrivate,
                hostingMode === 'own' ? peerDomain.trim() : undefined
            );
            handleClose();
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

    const stepTitles: Record<Step, string> = {
        topic: 'What will your community be about?',
        privacy: 'Choose privacy level',
        hosting: 'Where will this community be hosted?',
        details: 'Community details',
    };

    // Progress dots — 4 steps now
    const steps: Step[] = ['topic', 'privacy', 'hosting', 'details'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-4 border-black dark:border-gray-700">
                    <h2 className="text-2xl font-black text-black dark:text-white">
                        {stepTitles[currentStep]}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="hover:bg-gray-200 dark:hover:bg-gray-800 p-2 transition-colors text-black dark:text-white"
                        disabled={loading}
                    >
                        <X size={24} className="font-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Topic Selection */}
                    {currentStep === 'topic' && (
                        <div>
                            <p className="font-bold mb-6 text-black dark:text-gray-300">Choose a topic to help people discover your community</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {communityTopics.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`flex items-center gap-2 p-3 border-4 border-black dark:border-gray-700 font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${selectedTopic?.id === topic.id
                                            ? 'bg-yellow-300 dark:bg-yellow-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                            : 'bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                            }`}
                                    >
                                        <span className="text-xl">{topic.emoji}</span>
                                        <span className="text-sm text-left">{topic.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Privacy Selection */}
                    {currentStep === 'privacy' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={`w-full p-6 border-4 border-black dark:border-gray-700 font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${!isPrivate
                                    ? 'bg-yellow-300 dark:bg-yellow-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    : 'bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    }`}
                            >
                                <div className="text-2xl mb-2">🌍 Public</div>
                                <div className="font-normal text-gray-800 dark:text-gray-300">Anyone can view, post, and comment</div>
                            </button>

                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`w-full p-6 border-4 border-black dark:border-gray-700 font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${isPrivate
                                    ? 'bg-yellow-300 dark:bg-yellow-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    : 'bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    }`}
                            >
                                <div className="text-2xl mb-2">🔒 Private (Invite-only)</div>
                                <div className="font-normal text-gray-800 dark:text-gray-300">Only approved members can view and submit</div>
                            </button>
                        </div>
                    )}

                    {/* Step 3: Hosting Selection */}
                    {currentStep === 'hosting' && (
                        <div className="space-y-4">
                            <p className="font-bold text-gray-700 dark:text-gray-300 mb-4">
                                You can host this community on the main Graphene server, or on your own self-hosted server.
                            </p>

                            {/* Main server option */}
                            <button
                                onClick={() => { setHostingMode('main'); setError(''); }}
                                className={`w-full p-6 border-4 border-black dark:border-gray-700 font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${hostingMode === 'main'
                                    ? 'bg-yellow-300 dark:bg-yellow-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    : 'bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Server className="w-6 h-6" strokeWidth={3} />
                                    <span className="text-xl">Main Server</span>
                                </div>
                                <div className="font-normal text-gray-700 dark:text-gray-300">
                                    Hosted on <code className="bg-black/10 dark:bg-white/10 px-1 rounded">graphene.app</code>. No setup needed — just create and go.
                                </div>
                            </button>

                            {/* Own server option */}
                            <button
                                onClick={() => setHostingMode('own')}
                                className={`w-full p-6 border-4 border-black dark:border-gray-700 font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${hostingMode === 'own'
                                    ? 'bg-blue-300 dark:bg-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    : 'bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Globe className="w-6 h-6" strokeWidth={3} />
                                    <span className="text-xl">My Own Server</span>
                                </div>
                                <div className="font-normal text-gray-700 dark:text-gray-300">
                                    You run your own Graphene backend. Posts stay on your server and federate to the main network.
                                </div>
                            </button>

                            {/* Domain input shown only when "own" is selected */}
                            {hostingMode === 'own' && (
                                <div className="mt-4">
                                    <label className="block font-black mb-2 text-black dark:text-white">
                                        Your Server IP or Domain *
                                    </label>
                                    <input
                                        type="text"
                                        value={peerDomain}
                                        onChange={(e) => { setPeerDomain(e.target.value); setError(''); }}
                                        placeholder="e.g. 203.0.113.42 or mygraphene.example.com"
                                        className="w-full p-3 border-4 border-black dark:border-gray-600 dark:bg-gray-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                                    />
                                    <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                                        Make sure your server is running and reachable at <code>http://&lt;your-domain&gt;/api</code>
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-100 dark:bg-red-900 border-4 border-red-500 p-4">
                                    <p className="font-bold text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Details */}
                    {currentStep === 'details' && (
                        <div className="space-y-4">
                            {hostingMode === 'own' && (
                                <div className="bg-blue-50 dark:bg-blue-950 border-4 border-blue-400 dark:border-blue-700 p-4">
                                    <p className="font-black text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                        <Globe className="w-4 h-4" strokeWidth={3} />
                                        Federated community — hosted on <span className="font-mono">{peerDomain}</span>
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block font-black mb-2 text-black dark:text-white">Community Name*</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., CoolCommunity"
                                    className="w-full p-3 border-4 border-black dark:border-gray-600 dark:bg-gray-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block font-black mb-2 text-black dark:text-white">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's your community about?"
                                    rows={4}
                                    className="w-full p-3 border-4 border-black dark:border-gray-600 dark:bg-gray-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-100 dark:bg-red-900 border-4 border-red-500 p-4">
                                    <p className="font-bold text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t-4 border-black dark:border-gray-700">
                    <button
                        onClick={currentStep === 'topic' ? handleClose : handleBack}
                        className="px-6 py-3 border-4 border-black dark:border-gray-600 font-black bg-white dark:bg-gray-800 text-black dark:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)]"
                        disabled={loading}
                    >
                        {currentStep === 'topic' ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={currentStep === 'details' ? handleCreate : handleNext}
                        disabled={
                            loading ||
                            (currentStep === 'topic' && !selectedTopic) ||
                            (currentStep === 'details' && !name.trim())
                        }
                        className={`px-6 py-3 border-4 border-black dark:border-black font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] flex items-center justify-center gap-2 ${loading ||
                            (currentStep === 'topic' && !selectedTopic) ||
                            (currentStep === 'details' && !name.trim())
                            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                            : 'bg-yellow-300 dark:bg-yellow-600 hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-black dark:text-white'
                            }`}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size={20} className="text-black dark:text-white" />
                                <span>Please wait...</span>
                            </>
                        ) : (
                            currentStep === 'details' ? 'Create Community' : 'Next'
                        )}
                    </button>
                </div>

                {/* Progress Indicator — 4 dots */}
                <div className="flex gap-2 justify-center pb-4">
                    {steps.map(s => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full border-2 border-black dark:border-gray-500 ${currentStep === s ? 'bg-black dark:bg-white' : 'bg-white dark:bg-gray-800'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
