import { useState, useCallback } from 'react';
import { VoteService, VoteDirection } from '../services/VoteService';

interface UseVoteProps {
    initialVotes: number;
    postId: string;
}

export const useVote = ({ initialVotes, postId }: UseVoteProps) => {
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState<VoteDirection | null>(null);
    const [status, setStatus] = useState<'idle' | 'voting' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleVote = useCallback(async (direction: VoteDirection) => {
        // store previous state for rollback
        const previousVotes = votes;
        const previousUserVote = userVote;

        // Optimistic update
        setStatus('voting');
        setError(null);

        // Determine the new vote count
        let newVotes = votes;
        if (userVote === direction) {
            // Toggle off if clicking same direction
            // Logic: if already upvoted and click up, remove upvote (decrease by 1)
            // Implementation choice: For simplicity in this demo, let's just allow toggling or switching
            // But standard reddit style: 
            // specific logic:
            // if passing 'up':
            //   if current 'up' -> remove vote (count - 1), set null
            //   if current 'down' -> switch to up (count + 2), set 'up'
            //   if current null -> add vote (count + 1), set 'up'

            if (direction === 'up') {
                newVotes = votes - 1;
                setUserVote(null);
            } else { // direction === 'down'
                newVotes = votes + 1;
                setUserVote(null);
            }
        } else {
            // Switching or new vote
            if (direction === 'up') {
                newVotes = userVote === 'down' ? votes + 2 : votes + 1;
                setUserVote('up');
            } else { // direction === 'down'
                newVotes = userVote === 'up' ? votes - 2 : votes - 1;
                setUserVote('down');
            }
        }

        setVotes(newVotes);

        try {
            await VoteService.vote(postId, direction, newVotes);
            setStatus('idle');
        } catch (err) {
            // Rollback on error
            console.error('Vote failed:', err);
            setVotes(previousVotes);
            setUserVote(previousUserVote);
            setStatus('error');
            setError('Failed to vote. Please try again.');
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
