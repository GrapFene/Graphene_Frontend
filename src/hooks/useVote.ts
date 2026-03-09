import { useState, useCallback } from 'react';
import { VoteService, VoteDirection } from '../services/VoteService';

interface UseVoteProps {
    initialVotes: number;
    postId: string;
    initialUserVote?: number | null;
    peerDomain?: string | null;
}

/**
 * Custom hook for handling voting logic
 * 
 * Functionality: Manages vote state, handles API calls for voting, and provides optimistic UI updates.
 * Input: initialVotes (number) - Initial score of the post.
 *        postId (string) - The ID of the post.
 *        initialUserVote (number | null) - The initial vote of the user (1 for up, -1 for down, null for none).
 *        peerDomain (string | null, optional) - The peer instance domain if the post is federated.
 * Response: Object containing votes, userVote, status, error, and handleVote function.
 */
export const useVote = ({ initialVotes, postId, initialUserVote = null, peerDomain }: UseVoteProps) => {
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
                result = await VoteService.removeVote(postId, peerDomain);
            } else {
                // Otherwise cast a new vote (or switch vote direction)
                result = await VoteService.vote(postId, direction, peerDomain);
            }

            // Always update score from server (source of truth),
            // but keep our optimistic userVote — the server confirmed the action succeeded.
            if (typeof result.score === 'number') {
                setVotes(result.score);
            }
            // Sync userVote from server only if it's a valid value
            if (result.userVote === 1) {
                setUserVote('up');
            } else if (result.userVote === -1) {
                setUserVote('down');
            } else if (result.userVote === null || result.userVote === 0) {
                setUserVote(null);
            }
            // If server returns something unexpected, keep optimistic state (already set above)

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
