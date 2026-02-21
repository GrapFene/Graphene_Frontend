import { useState, useCallback } from 'react';
import { VoteService, VoteDirection } from '../services/VoteService';

interface UseVoteProps {
    initialVotes: number;
    postId: string;
    initialUserVote?: number | null;
}

/**
 * Custom hook for handling voting logic
 * 
 * Functionality: Manages vote state, handles API calls for voting, and provides optimistic UI updates.
 * Input: initialVotes (number) - Initial score of the post.
 *        postId (string) - The ID of the post.
 *        initialUserVote (number | null) - The initial vote of the user (1 for up, -1 for down, null for none).
 * Response: Object containing votes, userVote, status, error, and handleVote function.
 */
export const useVote = ({ initialVotes, postId, initialUserVote = null }: UseVoteProps) => {
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState<VoteDirection | null>(() => {
        if (initialUserVote === 1) return 'up';
        if (initialUserVote === -1) return 'down';
        return null;
    });
    const [status, setStatus] = useState<'idle' | 'voting' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleVote = useCallback(async (direction: VoteDirection) => {
        // Prevent multiple simultaneous votes
        if (status === 'voting') return;

        // Store previous state for rollback
        const previousVotes = votes;
        const previousUserVote = userVote;

        // Optimistic update
        setStatus('voting');
        setError(null);

        // Calculate optimistic score change
        let scoreChange = 0;
        let newUserVote: VoteDirection | null = null;

        if (userVote === direction) {
            // Toggling off - remove the vote
            newUserVote = null;
            scoreChange = direction === 'up' ? -1 : 1; // Remove upvote: -1, Remove downvote: +1
        } else if (userVote === null) {
            // New vote - no previous vote
            newUserVote = direction;
            scoreChange = direction === 'up' ? 1 : -1; // Upvote: +1, Downvote: -1
        } else {
            // Switching vote (e.g. up -> down or down -> up)
            newUserVote = direction;
            // Removing old vote and adding new vote
            // If was up (+1) and going down (-1): remove +1, add -1 = -2 total
            // If was down (-1) and going up (+1): remove -1, add +1 = +2 total
            scoreChange = direction === 'up' ? 2 : -2;
        }

        const optimisticVotes = votes + scoreChange;
        setVotes(optimisticVotes);
        setUserVote(newUserVote);

        try {
            let result;

            // If clicking the same direction, remove the vote
            if (userVote === direction) {
                result = await VoteService.removeVote(postId);
            } else {
                // Otherwise cast a new vote (or switch vote direction)
                result = await VoteService.vote(postId, direction);
            }

            // Only update if the server response differs from our optimistic update
            // This prevents overwriting if user made another vote action during the API call
            if (result.userVote === 1 && newUserVote === 'up') {
                // Server confirms upvote - keep optimistic state
            } else if (result.userVote === -1 && newUserVote === 'down') {
                // Server confirms downvote - keep optimistic state
            } else if (result.userVote === null && newUserVote === null) {
                // Server confirms vote removal - keep optimistic state
            } else {
                // Something changed on the server, sync with server state
                setVotes(result.score);
                if (result.userVote === 1) {
                    setUserVote('up');
                } else if (result.userVote === -1) {
                    setUserVote('down');
                } else {
                    setUserVote(null);
                }
            }

            setStatus('idle');
        } catch (err) {
            // Rollback on error
            console.error('Vote failed:', err);
            setVotes(previousVotes);
            setUserVote(previousUserVote);
            setStatus('error');
            setError('Failed to vote. Please try again.');

            // Clear error after 3 seconds
            setTimeout(() => {
                setError(null);
                setStatus('idle');
            }, 3000);
        }
    }, [votes, userVote, postId, status]);

    return {
        votes,
        userVote,
        status,
        error,
        handleVote
    };
};
