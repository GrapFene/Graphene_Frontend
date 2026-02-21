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

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 || error.response?.status === 401) {
            const errorMessage = error.response?.data?.error?.message || 'Session expired';
            
            // Clear auth data
            localStorage.removeItem('graphene_token');
            localStorage.removeItem('graphene_user');
            
            // Dispatch auth change event
            window.dispatchEvent(new Event('authChange'));
            
            // Redirect to login
            window.location.href = '/login';
            
            // Return a more helpful error
            return Promise.reject(new Error(`Authentication failed: ${errorMessage}. Please login again.`));
        }
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
/**
 * Registers a new user
 * 
 * Functionality: Sends a registration request to the backend.
 * Input: data (any) - Registration data excluding password_hash.
 * Response: Promise<any> - The response data from the backend.
 */
export const register = async (data: any) => {
    // Ensure no password_hash is sent even if passed by mistake
    const { password_hash, ...rest } = data;
    // Pass everything else, including profile_content, profile_signed_hash, etc.
    const response = await api.post('/auth/register', rest);
    return response.data;
};

/**
 * Initiates user login
 * 
 * Functionality: Sends a login initiation request to the backend.
 * Input: data (any) - Login data excluding password_hash.
 * Response: Promise<any> - The response data containing challenge or other init data.
 */
export const loginInit = async (data: any) => {
    // Ensure no password_hash is sent
    const { password_hash, ...rest } = data;
    const response = await api.post('/auth/login-init', rest);
    return response.data;
};

/**
 * Verifies user login
 * 
 * Functionality: Sends a login verification request to the backend.
 * Input: data (any) - Verification data.
 * Response: Promise<any> - The response data containing auth token.
 */
export const loginVerify = async (data: any) => {
    const response = await api.post('/auth/login-verify', data);
    return response.data;
};

// Community Actions
/**
 * Joins a community
 * 
 * Functionality: Subscribes the current user to a specified community (subreddit).
 * Input: subreddit (string) - The name of the community to join.
 * Response: Promise<any> - The response from the subscription endpoint.
 */
export const joinCommunity = async (subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);

    const response = await api.post('/subscriptions/subscribe', { did: user.did, subreddit });
    return response.data;
};

/**
 * Leaves a community
 * 
 * Functionality: Unsubscribes the current user from a specified community.
 * Input: subreddit (string) - The name of the community to leave.
 * Response: Promise<any> - The response from the unsubscription endpoint.
 */
export const leaveCommunity = async (subreddit: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);

    const response = await api.post('/subscriptions/unsubscribe', { did: user.did, subreddit });
    return response.data;
};

/**
 * Blocks a community
 * 
 * Functionality: Blocks a community for the current user.
 * Input: communityName (string) - The name of the community to block.
 * Response: Promise<any> - The response from the block endpoint.
 */
export const blockCommunity = async (communityName: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);

    const response = await api.post('/blocks', { did: user.did, communityName });
    return response.data;
};

/**
 * Unblocks a community
 * 
 * Functionality: Unblocks a previously blocked community for the current user.
 * Input: communityName (string) - The name of the community to unblock.
 * Response: Promise<any> - The response from the unblock endpoint.
 */
export const unblockCommunity = async (communityName: string) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error("User not logged in");
    const user = JSON.parse(userStr);

    const response = await api.delete(`/blocks/${communityName}?did=${user.did}`);
    return response.data;
};

/**
 * Gets blocked communities
 * 
 * Functionality: Retrieves a list of communities blocked by the current user.
 * Input: None
 * Response: Promise<string[]> - A list of blocked community names.
 */
export const getBlockedCommunities = async () => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);

    const response = await api.get(`/blocks?did=${user.did}`);
    return response.data; // array of strings
};

/**
 * Gets subscribed communities
 * 
 * Functionality: Retrieves a list of communities the current user is subscribed to.
 * Input: None
 * Response: Promise<string[]> - A list of subscribed community names.
 */
export const getSubscribedCommunities = async () => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);

    const response = await api.get(`/subscriptions/list?did=${user.did}`);
    return response.data; // array of strings (subreddits)
};

// Posts
/**
 * Gets post details
 * 
 * Functionality: Retrieves detailed information about a specific post.
 * Input: id (string) - The ID of the post.
 *        viewerDid (string, optional) - The DID of the viewer to interpret votes and blocks.
 * Response: Promise<Post> - The post details object.
 */
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

/**
 * Gets feed posts
 * 
 * Functionality: Retrieves a list of posts for the feed, optionally sorted.
 * Input: sort ('recent' | 'trending') - The sort order (default: 'recent').
 * Response: Promise<Post[]> - An array of post objects.
 */
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

/**
 * Gets posts by community
 * 
 * Functionality: Retrieves a list of posts belonging to a specific community.
 * Input: subreddit (string) - The community name.
 * Response: Promise<Post[]> - An array of post objects.
 */
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



/**
 * Creates a new post
 * 
 * Functionality: Creates a new post, optionally uploading media first.
 * Input: title (string) - Post title.
 *        content (string) - Post content.
 *        subreddit (string) - Community name.
 *        mediaFile (File, optional) - Image or video file to upload.
 * Response: Promise<any> - The created post data.
 */
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
/**
 * Gets communities
 * 
 * Functionality: Retrieves a list of communities matching a search term.
 * Input: search (string) - Search term (default: '').
 * Response: Promise<any> - List of communities.
 */
export const getCommunities = async (search: string = '') => {
    const response = await api.get(`/communities?search=${search}`);
    return response.data; // Returns { name, description, subscriber_count }
};

/**
 * Gets top communities
 * 
 * Functionality: Retrieves a list of top communities.
 * Input: limit (number) - Max number of communities to return (default: 5).
 * Response: Promise<any> - List of top communities.
 */
export const getTopCommunities = async (limit: number = 5) => {
    const response = await api.get(`/communities/top?limit=${limit}`);
    return response.data;
};

/**
 * Creates a new community
 * 
 * Functionality: Creates a new community (subreddit).
 * Input: name (string) - Community name.
 *        description (string) - Community description.
 *        topic (string, optional) - Community topic.
 *        isPrivate (boolean, optional) - Whether the community is private.
 * Response: Promise<any> - The created community data.
 */
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
/**
 * Subscribes to a community
 * 
 * Functionality: Adds a subscription for the user to the specified community.
 * Input: communityName (string) - The name of the community.
 * Response: Promise<any> - The subscription response.
 */
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
/**
 * Creates a new comment
 * 
 * Functionality: Adds a comment to a post or a reply to another comment.
 * Input: postId (string) - The ID of the post.
 *        content (string) - The comment content.
 *        parentId (string, optional) - The ID of the parent comment if it's a reply.
 * Response: Promise<any> - The created comment data.
 */
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

/**
 * Votes on a comment
 * 
 * Functionality: Submits a vote for a comment (upvote or downvote).
 * Input: commentId (string) - The ID of the comment.
 *        voteType (1 | -1) - The type of vote.
 * Response: Promise<any> - The vote response.
 */
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

/**
 * Updates user profile
 * 
 * Functionality: Updates the profile information for a user.
 * Input: params (object) - Object containing did, content, nonce, signed_hash, etc.
 * Response: Promise<any> - The update response.
 */
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

/**
 * Gets user profile
 * 
 * Functionality: Retrieves the profile information for a specific DID.
 * Input: did (string) - The Decentralized Identifier of the user.
 * Response: Promise<any> - The profile data.
 */
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

/**
 * Gets guardians
 * 
 * Functionality: Retrieves the list of guardians for the current user.
 * Input: None
 * Response: Promise<any> - List of guardians.
 */
export const getGuardians = async () => {
    const response = await api.get('/recovery/guardians');
    return response.data;
};

/**
 * Sets guardians
 * 
 * Functionality: Sets the list of guardians for the current user.
 * Input: guardianDids (string[]) - Array of guardian DIDs.
 * Response: Promise<any> - The response from setting guardians.
 */
export const setGuardians = async (guardianDids: string[]) => {
    const userStr = localStorage.getItem('graphene_user');
    if (!userStr) throw new Error('User not logged in');

    const response = await api.post('/recovery/guardians', {
        guardian_dids: guardianDids
    });
    return response.data;
};

/**
 * Initiates account recovery
 * 
 * Functionality: Starts the account recovery process.
 * Input: data (object) - Recovery data including target_did, new_salt, etc.
 * Response: Promise<any> - The recovery request response.
 */
export const initiateRecovery = async (data: {
    target_did: string;
    new_password_hash?: string;
    new_salt: string;
    new_mnemonic_hashes: string[];
}) => {
    const response = await api.post('/recovery/request', data);
    return response.data;
};

/**
 * Gets pending recovery requests
 * 
 * Functionality: Retrieves a list of pending recovery requests.
 * Input: None
 * Response: Promise<RecoveryRequestInfo[]> - List of recovery requests.
 */
export const getPendingRecoveryRequests = async () => {
    const response = await api.get('/recovery/requests');
    return response.data; // Returns RecoveryRequestInfo[]
};

/**
 * Approves a recovery request
 * 
 * Functionality: Approves a specific recovery request.
 * Input: requestId (string) - The ID of the recovery request.
 * Response: Promise<any> - The approval response.
 */
export const approveRecovery = async (requestId: string) => {
    const response = await api.post('/recovery/approve', { request_id: requestId });
    return response.data;
};

/**
 * Finalizes recovery
 * 
 * Functionality: Finalizes the recovery process after sufficient approvals.
 * Input: requestId (string) - The ID of the recovery request.
 * Response: Promise<any> - The finalization response.
 */
export const finalizeRecovery = async (requestId: string) => {
    const response = await api.post('/recovery/finalize', { request_id: requestId });
    return response.data;
};


