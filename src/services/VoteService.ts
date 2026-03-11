export type VoteDirection = 'up' | 'down';

interface VoteResponse {
    score: number;
    userVote: number | null;
}

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const VoteService = {
    /**
     * Casts a vote on a post
     *
     * Functionality: Submits a vote (up or down) for a specific post.
     * Input: postId (string) - The ID of the post.
     *        direction (VoteDirection) - 'up' or 'down'.
     *        peerDomain (string | null, optional) - The peer instance domain if the post is federated.
     * Response: Promise<VoteResponse> - The updated vote score and user vote status.
     */
    vote: async (postId: string, direction: VoteDirection, peerDomain?: string | null): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) {
            throw new Error('User not logged in');
        }

        const user = JSON.parse(userStr);
        const voteType = direction === 'up' ? 1 : -1;

        const token = localStorage.getItem('graphene_token');

        // If a peer domain is provided, hit that peer's backend directly
        const voteUrl = peerDomain
            ? `https://${peerDomain}/api/votes`
            : `${API_URL}/votes`;

        const response = await fetch(voteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(peerDomain ? { 'ngrok-skip-browser-warning': 'true' } : {}),
            },
            body: JSON.stringify({
                did: user.did,
                postId,
                voteType,
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit vote');
        }

        return await response.json();
    },

    /**
     * Removes a vote from a post
     *
     * Functionality: Removes a previously cast vote for a specific post.
     * Input: postId (string) - The ID of the post.
     *        peerDomain (string | null, optional) - The peer instance domain if the post is federated.
     * Response: Promise<VoteResponse> - The updated vote score and user vote status.
     */
    removeVote: async (postId: string, peerDomain?: string | null): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) {
            throw new Error('User not logged in');
        }

        const user = JSON.parse(userStr);
        const token = localStorage.getItem('graphene_token');

        // If a peer domain is provided, hit that peer's backend directly
        const voteUrl = peerDomain
            ? `https://${peerDomain}/api/votes`
            : `${API_URL}/votes`;

        const response = await fetch(voteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(peerDomain ? { 'ngrok-skip-browser-warning': 'true' } : {}),
            },
            body: JSON.stringify({
                did: user.did,
                postId,
                voteType: 0,
            })
        });

        if (!response.ok) {
            throw new Error('Failed to remove vote');
        }

        return await response.json();
    }
};
