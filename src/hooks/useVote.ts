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

        // Calculate optimistic score
        let newVotes = votes;
        let newUserVote: VoteDirection | null = direction;

        if (userVote === direction) {
            // Toggling off
            newUserVote = null;
            newVotes = direction === 'up' ? votes - 1 : votes + 1;
        } else if (userVote === null) {
            // New vote
            newVotes = direction === 'up' ? votes + 1 : votes - 1;
        } else {
            // Switching vote (e.g. up -> down)
            // If was up (+1) and going down (-1), change is -2
            // If was down (-1) and going up (+1), change is +2
            newVotes = direction === 'up' ? votes + 2 : votes - 2;
        }

        setVotes(newVotes);
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

            // Update with actual server response (should match optimistic, but ensures consistency)
            setVotes(result.score);

            // Sync user vote from server
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
