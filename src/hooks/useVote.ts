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
        // Store previous state for rollback
        const previousVotes = votes;
        const previousUserVote = userVote;

        // Optimistic update
        setStatus('voting');
        setError(null);

        try {
            let result;

            // If clicking the same direction, remove the vote
            if (userVote === direction) {
                result = await VoteService.removeVote(postId);
                setUserVote(null);
            } else {
                // Otherwise cast a new vote (or switch vote direction)
                result = await VoteService.vote(postId, direction);
                setUserVote(direction);
            }

            // Update with server response
            setVotes(result.score);

            // Sync user vote from server (in case of race conditions)
            if (result.userVote === 1) setUserVote('up');
            else if (result.userVote === -1) setUserVote('down');
            else setUserVote(null);

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
    }, [votes, userVote, postId]);

    return {
        votes,
        userVote,
        status,
        error,
        handleVote
    };
};
