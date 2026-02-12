export type VoteDirection = 'up' | 'down';

interface VoteResponse {
    score: number;
    userVote: number | null;
}

const API_URL = 'http://localhost:3000';

export const VoteService = {
    vote: async (postId: string, direction: VoteDirection): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) {
            throw new Error('User not logged in');
        }

        const user = JSON.parse(userStr);
        const voteType = direction === 'up' ? 1 : -1;

        const token = localStorage.getItem('graphene_token');
        const response = await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                did: user.did,
                voteType
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit vote');
        }

        return await response.json();
    },

    removeVote: async (postId: string): Promise<VoteResponse> => {
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) {
            throw new Error('User not logged in');
        }

        const user = JSON.parse(userStr);
        const token = localStorage.getItem('graphene_token');

        const response = await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                did: user.did,
                voteType: 0
            })
        });

        if (!response.ok) {
            throw new Error('Failed to remove vote');
        }

        return await response.json();
    }
};
