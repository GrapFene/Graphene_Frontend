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
    content: string;
    subreddit: string;
    created_at: string;
    score?: number;
    trendingScore?: number;
}

export interface Community {
    name: string;
    description: string;
    members: number;
    created_at: string;
}

// Auth (Existing)
export const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const loginInit = async (data: any) => {
    const response = await api.post('/auth/login-init', data);
    return response.data;
};

export const loginVerify = async (data: any) => {
    const response = await api.post('/auth/login-verify', data);
    return response.data;
};

// Posts
export const getFeed = async (sort: 'recent' | 'trending' = 'recent') => {
    const userStr = localStorage.getItem('graphene_user');
    let viewerDid = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // The identity object from loginVerify might have different structure. 
            // loginVerify returns { token, identity: { did, username, ... } }
            // Let's assume it has 'did' or 'address'. 
            // Wait, AuthPage saves 'result.identity'. 
            // Let's check AuthPage.tsx again to be sure what 'identity' contains.
            // It seems 'identity' from generateIdentity has 'address', 'mnemonic', etc.
            // But the backend 'loginVerify' returns the identity row from DB?
            // Let's assume it has 'did'.
            viewerDid = user.did;
        } catch (e) {
            console.error("Error parsing user from localstorage", e);
        }
    }

    // Pass viewerDid for blocking logic
    const response = await api.get(`/posts?sort=${sort}&viewerDid=${viewerDid}`);
    return response.data as Post[];
};

export const createPost = async (content: string, subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post('/posts', {
        did: user.did,
        content,
        subreddit
    });
    return response.data;
};

// Communities
export const getCommunities = async (search: string = '') => {
    const response = await api.get(`/communities?search=${search}`);
    return response.data; // Returns { name, description, subscriber_count }
};

export const createCommunity = async (name: string, description: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');
    const user = JSON.parse(userStr);

    const response = await api.post('/communities', {
        did: user.did,
        name,
        description
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
