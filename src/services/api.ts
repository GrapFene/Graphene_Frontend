const API_BASE_URL = 'http://localhost:3000';

interface RegisterParams {
    username: string;
    password_hash: string;
    salt: string;
    public_key: string;
    mnemonic_hashes: string[];
}

/**
 * Register a new user
 */
export const register = async ({ username, password_hash, salt, public_key, mnemonic_hashes }: RegisterParams) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password_hash, salt, public_key, mnemonic_hashes }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Registration failed');
    }

    return response.json();
};

interface LoginInitParams {
    username: string;
    password_hash: string;
}

/**
 * Initiate login - verify password and get mnemonic challenge
 */
export const loginInit = async ({ username, password_hash }: LoginInitParams) => {
    const response = await fetch(`${API_BASE_URL}/auth/login-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password_hash }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Login failed');
    }

    return response.json();
};

interface LoginVerifyParams {
    did: string;
    word_hashes: string[];
    indices: number[];
}

/**
 * Verify mnemonic words and complete login
 */
export const loginVerify = async ({ did, word_hashes, indices }: LoginVerifyParams) => {
    const response = await fetch(`${API_BASE_URL}/auth/login-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, word_hashes, indices }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Verification failed');
    }

    return response.json();
};

// =============================================================================
// Profile API
// =============================================================================

export interface ProfileContent {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
}

interface UpdateProfileParams {
    did: string;
    content: ProfileContent;
    nonce: string;
    signed_hash: string;
}

/**
 * Update user profile
 */
export const updateProfile = async (params: UpdateProfileParams) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Profile update failed');
    }

    return response.json();
};

/**
 * Get user profile
 */
export const getProfile = async (did: string) => {
    const response = await fetch(`${API_BASE_URL}/profile/${did}`);

    if (response.status === 404) return null;

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch profile');
    }

    return response.json();
};

// =============================================================================
// Social Recovery API
// =============================================================================

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

export const setGuardians = async (guardian_dids: string[], nicknames?: Record<string, string>) => {
    const response = await fetch(`${API_BASE_URL}/recovery/guardians`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('graphene_token')}`
        },
        body: JSON.stringify({ guardian_dids, nicknames }),
    });
    if (!response.ok) throw new Error('Failed to set guardians');
    return response.json();
};

export const getGuardians = async () => {
    const response = await fetch(`${API_BASE_URL}/recovery/guardians`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('graphene_token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch guardians');
    const data = await response.json();
    return data as { my_guardians: Guardian[], guarding_for: Guardian[] };
};

export const initiateRecovery = async (params: {
    target_did: string;
    new_password_hash: string;
    new_salt: string;
    new_mnemonic_hashes: string[];
}) => {
    const response = await fetch(`${API_BASE_URL}/recovery/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to initiate recovery');
    return response.json();
};

export const getPendingRecoveryRequests = async () => {
    const response = await fetch(`${API_BASE_URL}/recovery/requests`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('graphene_token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch recovery requests');
    const data = await response.json();
    return data as RecoveryRequestInfo[];
};

export const approveRecovery = async (request_id: string) => {
    const response = await fetch(`${API_BASE_URL}/recovery/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('graphene_token')}`
        },
        body: JSON.stringify({ request_id }),
    });
    if (!response.ok) throw new Error('Failed to approve recovery');
    return response.json();
};

export const finalizeRecovery = async (request_id: string) => {
    const response = await fetch(`${API_BASE_URL}/recovery/finalize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('graphene_token')}`
        },
        body: JSON.stringify({ request_id }),
    });
    if (!response.ok) throw new Error('Failed to finalize recovery');
    return response.json();
};
