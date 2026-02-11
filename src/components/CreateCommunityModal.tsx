import { useState } from 'react';
import { X } from 'lucide-react';
import { communityTopics, CommunityTopic } from '../data/communityTopics';
import { createCommunity } from '../services/api';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type Step = 'topic' | 'privacy' | 'details';

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('topic');
    const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        setCurrentStep('topic');
        setSelectedTopic(null);
        setIsPrivate(false);
        setName('');
        setDescription('');
        setError('');
        onClose();
    };

    const handleNext = () => {
        if (currentStep === 'topic' && selectedTopic) {
            setCurrentStep('privacy');
        } else if (currentStep === 'privacy') {
            setCurrentStep('details');
        }
    };

    const handleBack = () => {
        if (currentStep === 'privacy') {
            setCurrentStep('topic');
        } else if (currentStep === 'details') {
            setCurrentStep('privacy');
        }
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
                isPrivate
            );
            handleClose();
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-4 border-black">
                    <h2 className="text-2xl font-black">
                        {currentStep === 'topic' && 'What will your community be about?'}
                        {currentStep === 'privacy' && 'Choose privacy level'}
                        {currentStep === 'details' && 'Community details'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="hover:bg-gray-200 p-2 transition-colors"
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
                            <p className="font-bold mb-6">Choose a topic to help redditors discover your community</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {communityTopics.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`flex items-center gap-2 p-3 border-4 border-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${selectedTopic?.id === topic.id
                                                ? 'bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
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
                                className={`w-full p-6 border-4 border-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${!isPrivate
                                        ? 'bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                            >
                                <div className="text-2xl mb-2">🌍 Public</div>
                                <div className="font-normal">Anyone can view, post, and comment</div>
                            </button>

                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`w-full p-6 border-4 border-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-left ${isPrivate
                                        ? 'bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                            >
                                <div className="text-2xl mb-2">🔒 Private (Invite-only)</div>
                                <div className="font-normal">Only approved members can view and submit</div>
                            </button>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 'details' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block font-black mb-2">Community Name*</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., CoolCommunity"
                                    className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block font-black mb-2">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's your community about?"
                                    rows={4}
                                    className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-100 border-4 border-red-500 p-4">
                                    <p className="font-bold text-red-700">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t-4 border-black">
                    <button
                        onClick={currentStep === 'topic' ? handleClose : handleBack}
                        className="px-6 py-3 border-4 border-black font-black bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
                        className={`px-6 py-3 border-4 border-black font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${loading ||
                                (currentStep === 'topic' && !selectedTopic) ||
                                (currentStep === 'details' && !name.trim())
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-yellow-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                            }`}
                    >
                        {loading ? 'Creating...' : currentStep === 'details' ? 'Create Community' : 'Next'}
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex gap-2 justify-center pb-4">
                    <div className={`w-3 h-3 rounded-full border-2 border-black ${currentStep === 'topic' ? 'bg-black' : 'bg-white'}`} />
                    <div className={`w-3 h-3 rounded-full border-2 border-black ${currentStep === 'privacy' ? 'bg-black' : 'bg-white'}`} />
                    <div className={`w-3 h-3 rounded-full border-2 border-black ${currentStep === 'details' ? 'bg-black' : 'bg-white'}`} />
                </div>
            </div>
        </div>
    );
}
