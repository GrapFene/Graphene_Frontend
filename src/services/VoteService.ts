export type VoteDirection = 'up' | 'down';

interface VoteResponse {
    success: boolean;
    newCount: number;
}

export const VoteService = {
    vote: async (postId: string, direction: VoteDirection, currentCount: number): Promise<VoteResponse> => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simulate random failure (20% chance)
        if (Math.random() < 0.2) {
            throw new Error('Failed to submit vote. Please try again.');
        }

        // Calculate new count based on direction
        const newCount = direction === 'up' ? currentCount + 1 : currentCount - 1;

        return {
            success: true,
            newCount,
        };
    },
};
