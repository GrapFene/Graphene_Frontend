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

export default { register, loginInit, loginVerify };
