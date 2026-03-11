export type VoteDirection = 'up' | 'down';

interface VoteResponse {
    score: number;
    userVote: number | null;
}

// Always route through our own main backend.
// The main backend's /votes route checks peer_domain and forwards the vote to
// the peer using X-Federation-Forward headers — this is the only way to auth
// against a peer that has a different JWT secret.
const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const VoteService = {
    /**
     * Casts a vote on a post (local or peer).
     * Always goes through the main backend which proxies to the peer if needed.
     */
    vote: async (postId: string, direction: VoteDirection, peerDomain?: string | null): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) throw new Error('User not logged in');

        const user = JSON.parse(userStr);
        const voteType = direction === 'up' ? 1 : -1;
        const token = localStorage.getItem('graphene_token');

        const response = await fetch(`${API_URL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                did: user.did,
                postId,
                voteType,
                // If peer_domain is set the main backend will forward the vote there
                // using federation signing — never send the user's JWT to the peer.
                ...(peerDomain ? { peer_domain: peerDomain } : {}),
            }),
        });

        if (!response.ok) throw new Error('Failed to submit vote');
        return await response.json();
    },

    /**
     * Removes a vote from a post (local or peer).
     * Always goes through the main backend which proxies to the peer if needed.
     */
    removeVote: async (postId: string, peerDomain?: string | null): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) throw new Error('User not logged in');

        const user = JSON.parse(userStr);
        const token = localStorage.getItem('graphene_token');

        const response = await fetch(`${API_URL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                did: user.did,
                postId,
                voteType: 0,
                ...(peerDomain ? { peer_domain: peerDomain } : {}),
            }),
        });

        if (!response.ok) throw new Error('Failed to remove vote');
        return await response.json();
    },
};
