import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('graphene_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export interface Post {
    id: string;
    author_did: string;
    title: string;
    content: string;
    subreddit: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    created_at: string;
    score?: number;
    votes?: number; // Mapped from score
    user_vote?: number | null; // User's vote: 1, -1, or null
    trendingScore?: number;
    comments?: Comment[];
}

export interface Comment {
    id: string;
    post_id: string;
    author_did: string;
    content: string;
    parent_id?: string;
    created_at: string;
    vote_score?: number;
    user_vote?: number;
    replies?: Comment[];
}

export interface Community {
    name: string;
    description: string;
    members: number; // mapped from subscriber_count or manually set
    subscriber_count?: number;
    created_at: string;
}

// Auth (Existing)
export const register = async (data: any) => {
    // Ensure no password_hash is sent even if passed by mistake
    const { password_hash, ...rest } = data;
    // Pass everything else, including profile_content, profile_signed_hash, etc.
    const response = await api.post('/auth/register', rest);
    return response.data;
};

export const loginInit = async (data: any) => {
    // Ensure no password_hash is sent
    const { password_hash, ...rest } = data;
    const response = await api.post('/auth/login-init', rest);
    return response.data;
};

export const loginVerify = async (data: any) => {
    const response = await api.post('/auth/login-verify', data);
    return response.data;
};

// Community Actions
export const joinCommunity = async (subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);
    
    const response = await api.post('/subscriptions/subscribe', { did: user.did, subreddit });
    return response.data;
};

export const leaveCommunity = async (subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);
    
    const response = await api.post('/subscriptions/unsubscribe', { did: user.did, subreddit });
    return response.data;
};

export const blockCommunity = async (communityName: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);
    
    const response = await api.post('/blocks', { did: user.did, communityName });
    return response.data;
};

export const unblockCommunity = async (communityName: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);
    
    const response = await api.delete(`/blocks/${communityName}?did=${user.did}`);
    return response.data;
};

export const getBlockedCommunities = async () => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);
    
    const response = await api.get(`/blocks?did=${user.did}`);
    return response.data; // array of strings
};

export const getSubscribedCommunities = async () => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);
    
    const response = await api.get(`/subscriptions/list?did=${user.did}`);
    return response.data; // array of strings (subreddits)
};

// Posts
export const getPostDetails = async (id: string, viewerDid?: string) => {
    if (!viewerDid) {
        const userStr = localStorage.getItem('graphene_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                viewerDid = user.did;
            } catch (e) { }
        }
    }

    const response = await api.get(`/posts/${id}?viewerDid=${viewerDid || ''}`);
    const post = response.data;

    // Map backend format (score) to frontend format (votes)
    return {
        ...post,
        votes: post.score || 0,
        user_vote: post.user_vote,
        imageUrl: post.media_url,
        mediaType: post.media_type
    } as Post;
};

export const getFeed = async (sort: 'recent' | 'trending' = 'recent') => {
    const userStr = localStorage.getItem('graphene_user');
    let viewerDid = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            viewerDid = user.did;
        } catch (e) {
            console.error("Error parsing user from localstorage", e);
        }
    }

    // Pass viewerDid for blocking logic and vote info
    const response = await api.get(`/posts?sort=${sort}&viewerDid=${viewerDid}`);
    const posts = response.data as any[];

    // Map backend format (score) to frontend format (votes)
    return posts.map(post => ({
        ...post,
        votes: post.score || 0,
        user_vote: post.user_vote,
        imageUrl: post.media_url,
        mediaType: post.media_type
    })) as Post[];
};

export const getPostsByCommunity = async (subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    let viewerDid = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            viewerDid = user.did;
        } catch (e) { }
    }
    const response = await api.get(`/posts?subreddit=${subreddit}&viewerDid=${viewerDid}`);
    const posts = response.data as any[];

    // Map backend format (score) to frontend format (votes)
    return posts.map(post => ({
        ...post,
        votes: post.score || 0,
        user_vote: post.user_vote,
        imageUrl: post.media_url,
        mediaType: post.media_type
    })) as Post[];
};



export const createPost = async (title: string, content: string, subreddit: string, mediaFile?: File | null) => {
    let mediaOb = {};
    if (mediaFile) {
        // First upload the file
        const formData = new FormData();
        formData.append('file', mediaFile);
        
        try {
            const uploadRes = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (uploadRes.data?.url) {
                mediaOb = {
                    media_url: uploadRes.data.url,
                    media_type: mediaFile.type.startsWith('image/') ? 'image' : 'video'
                };
            }
        } catch (e) {
            console.error('Failed to upload media', e);
            throw new Error('Media upload failed');
        }
    }

    const response = await api.post('/posts', { 
        title, // Use provided title
        content, 
        subreddit,
        ...mediaOb
    });
    return response.data;
};

// Communities
export const getCommunities = async (search: string = '') => {
    const response = await api.get(`/communities?search=${search}`);
    return response.data; // Returns { name, description, subscriber_count }
};

export const getTopCommunities = async (limit: number = 5) => {
    const response = await api.get(`/communities/top?limit=${limit}`);
    return response.data;
};

export const createCommunity = async (name: string, description: string, topic?: string, isPrivate?: boolean) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post('/communities', {
        did: user.did,
        name,
        description,
        topic,
        is_private: isPrivate
    });
    return response.data;
};

// Subscriptions
export const subscribe = async (communityName: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post('/subscriptions', {
        subscriber_did: user.did,
        community_name: communityName
    });
    return response.data;
};

// Comments
export const createComment = async (postId: string, content: string, parentId?: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post('/comments', {
        did: user.did,
        postId,
        content,
        parentId
    });
    return response.data;
};

export const voteComment = async (commentId: string, voteType: 1 | -1) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post(`/comments/${commentId}/vote`, {
        did: user.did,
        voteType
    });
    return response.data;
};

// Profile
export interface ProfileContent {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
}

export const updateProfile = async (params: {
    did: string;
    content: ProfileContent;
    nonce: string;
    signed_hash: string;
    word_hashes?: string[];
    indices?: number[];
}) => {
    const response = await api.post('/profile', params);
    return response.data;
};

export const getProfile = async (did: string) => {
    const response = await api.get(`/profile/${did}`);
    return response.data;
};

// Recovery / Guardians
export interface Guardian {
    did: string;
    username: string;
    nickname?: string;
}

export interface RecoveryRequestInfo {
    id: string;
    target_did: string;
    target_username: string;
    created_at: string;
    expires_at: string;
    approvals: number;
    required_approvals: number;
    has_approved: boolean;
}

export const getGuardians = async () => {
    const response = await api.get('/recovery/guardians');
    return response.data;
};

export const setGuardians = async (guardianDids: string[]) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');

    const response = await api.post('/recovery/guardians', {
        guardian_dids: guardianDids
    });
    return response.data;
};

export const initiateRecovery = async (data: {
    target_did: string;
    new_password_hash?: string;
    new_salt: string;
    new_mnemonic_hashes: string[];
}) => {
    const response = await api.post('/recovery/request', data);
    return response.data;
};

export const getPendingRecoveryRequests = async () => {
    const response = await api.get('/recovery/requests');
    return response.data; // Returns RecoveryRequestInfo[]
};

export const approveRecovery = async (requestId: string) => {
    const response = await api.post('/recovery/approve', { request_id: requestId });
    return response.data;
};

export const finalizeRecovery = async (requestId: string) => {
    const response = await api.post('/recovery/finalize', { request_id: requestId });
    return response.data;
};


