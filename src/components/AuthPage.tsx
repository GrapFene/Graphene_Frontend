import React, { useState } from 'react';
import { generateIdentity, hashData, hashMnemonic, generateSalt, hashMnemonicWord } from '../utils/crypto';
import { register, loginInit, loginVerify } from '../services/api';

interface AuthPageProps {
    onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phase, setPhase] = useState<'input' | 'display' | 'challenge'>('input');
    const [identity, setIdentity] = useState<any>(null); // Replace 'any' with proper type if available
    const [salt, setSalt] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Login state
    const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
    const [challengeWords, setChallengeWords] = useState<string[]>(['', '', '']);
    const [loginDid, setLoginDid] = useState('');

    const resetState = () => {
        setPhase('input');
        setIdentity(null);
        setSalt('');
        setError('');
        setChallengeIndices([]);
        setChallengeWords(['', '', '']);
        setLoginDid('');
    };

    const handleTabChange = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        resetState();
        setUsername('');
        setPassword('');
    };

    // ===== REGISTRATION FLOW =====
    const handleGenerateIdentity = () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }
        setError('');
        const id = generateIdentity();
        const newSalt = generateSalt();
        setIdentity(id);
        setSalt(newSalt);
        setPhase('display');
    };

    const handleRegister = async () => {
        if (!identity) return;
        setLoading(true);
        setError('');

        try {
            const passwordHash = hashData(password);
            const mnemonicHashes = hashMnemonic(identity.mnemonic, salt);

            await register({
                username,
                password_hash: passwordHash,
                salt,
                public_key: identity.address,
                mnemonic_hashes: mnemonicHashes,
            });

            alert(`Registration successful! Welcome, ${username}. Please save your mnemonic words!`);
            handleTabChange('login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // ===== LOGIN FLOW =====
    const handleLoginInit = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const passwordHash = hashData(password);
            const result = await loginInit({ username, password_hash: passwordHash });

            setChallengeIndices(result.challenge_indices);
            setLoginDid(result.did);
            setSalt(result.salt); // Store salt for verification
            setPhase('challenge');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginVerify = async () => {
        setLoading(true);
        setError('');

        try {
            // Hash each word with the stored salt (same as registration)
            const wordHashes = challengeWords.map((word, i) =>
                hashMnemonicWord(word.toLowerCase().trim(), salt)
            );

            const result = await loginVerify({
                did: loginDid,
                word_hashes: wordHashes,
                indices: challengeIndices,
            });

            // Store token
            localStorage.setItem('graphene_token', result.token);
            localStorage.setItem('graphene_user', JSON.stringify(result.identity));

            // Call parent callback
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const updateChallengeWord = (index: number, value: string) => {
        const newWords = [...challengeWords];
        newWords[index] = value;
        setChallengeWords(newWords);
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%'
        }}>
            <div className="glass-panel" style={{
                padding: '3rem',
                maxWidth: '550px',
                width: '90%',
                textAlign: 'center'
            }}>
                <h1 className="cyber-text-neon" style={{ marginBottom: '1.5rem' }}>
                    GrapFene
                    <span style={{ fontSize: '0.4em', display: 'block', letterSpacing: '2px', color: '#fff' }}>
                        FEDERALIZED NETWORK
                    </span>
                </h1>

                {/* Tab Buttons */}
                <div style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.5rem' }}>
                    <button
                        className={`cyber-button ${activeTab === 'login' ? '' : 'cyber-button-secondary'}`}
                        onClick={() => handleTabChange('login')}
                        style={{ flex: 1 }}
                    >
                        LOGIN
                    </button>
                    <button
                        className={`cyber-button ${activeTab === 'register' ? '' : 'cyber-button-secondary'}`}
                        onClick={() => handleTabChange('register')}
                        style={{ flex: 1 }}
                    >
                        REGISTER
                    </button>
                </div>

                {error && (
                    <div className="warning-box" style={{ marginBottom: '1rem', background: 'rgba(255,0,0,0.2)' }}>
                        {error}
                    </div>
                )}

                {/* ========== REGISTER TAB ========== */}
                {activeTab === 'register' && (
                    <>
                        {phase === 'input' && (
                            <div className="input-phase">
                                <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                                    Create your secure identity
                                </p>
                                <input
                                    type="text"
                                    className="cyber-input"
                                    placeholder="USERNAME"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ marginBottom: '1rem' }}
                                />
                                <input
                                    type="password"
                                    className="cyber-input"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ marginBottom: '1.5rem' }}
                                />
                                <button
                                    className="cyber-button"
                                    onClick={handleGenerateIdentity}
                                    style={{ width: '100%' }}
                                >
                                    GENERATE IDENTITY
                                </button>
                            </div>
                        )}

                        {phase === 'display' && identity && (
                            <div className="display-phase">
                                <p className="cyber-text-neon" style={{ fontSize: '0.9em', marginBottom: '0.5rem' }}>
                                    IDENTITY GENERATED
                                </p>

                                <div className="warning-box">
                                    <strong>CRITICAL WARNING</strong><br />
                                    Save this mnemonic sequence. It is the ONLY way to recover your account.
                                    We do not store it.
                                </div>

                                <div className="mnemonic-grid">
                                    {identity.mnemonic.split(' ').map((word: string, idx: number) => (
                                        <div key={idx} className="mnemonic-word">
                                            <span style={{ opacity: 0.5, marginRight: '5px' }}>{idx + 1}.</span>
                                            {word}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.8em', opacity: 0.7 }}>PUBLIC KEY</label>
                                    <div className="cyber-input" style={{ fontSize: '0.75em', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {identity.address}
                                    </div>
                                </div>

                                <button
                                    className="cyber-button"
                                    onClick={handleRegister}
                                    disabled={loading}
                                    style={{ width: '100%', marginTop: '2rem' }}
                                >
                                    {loading ? 'REGISTERING...' : 'COMPLETE REGISTRATION'}
                                </button>

                                <button
                                    className="cyber-button cyber-button-secondary"
                                    onClick={() => setPhase('input')}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    BACK
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ========== LOGIN TAB ========== */}
                {activeTab === 'login' && (
                    <>
                        {phase === 'input' && (
                            <div className="input-phase">
                                <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                                    Authenticate to access the network
                                </p>
                                <input
                                    type="text"
                                    className="cyber-input"
                                    placeholder="USERNAME"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ marginBottom: '1rem' }}
                                />
                                <input
                                    type="password"
                                    className="cyber-input"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ marginBottom: '1.5rem' }}
                                />
                                <button
                                    className="cyber-button"
                                    onClick={handleLoginInit}
                                    disabled={loading}
                                    style={{ width: '100%' }}
                                >
                                    {loading ? 'VERIFYING...' : 'CONTINUE'}
                                </button>
                            </div>
                        )}

                        {phase === 'challenge' && (
                            <div className="challenge-phase">
                                <p className="cyber-text-neon" style={{ fontSize: '0.9em', marginBottom: '0.5rem' }}>
                                    IDENTITY VERIFICATION
                                </p>
                                <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                                    Enter the following words from your mnemonic phrase:
                                </p>

                                {challengeIndices.map((idx, i) => (
                                    <div key={idx} style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8em', opacity: 0.7, display: 'block', textAlign: 'left', marginBottom: '0.3rem' }}>
                                            WORD #{idx + 1}
                                        </label>
                                        <input
                                            type="text"
                                            className="cyber-input"
                                            placeholder={`Enter word ${idx + 1}`}
                                            value={challengeWords[i]}
                                            onChange={(e) => updateChallengeWord(i, e.target.value)}
                                        />
                                    </div>
                                ))}

                                <button
                                    className="cyber-button"
                                    onClick={handleLoginVerify}
                                    disabled={loading}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                >
                                    {loading ? 'AUTHENTICATING...' : 'VERIFY & LOGIN'}
                                </button>

                                <button
                                    className="cyber-button cyber-button-secondary"
                                    onClick={() => setPhase('input')}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    BACK
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
