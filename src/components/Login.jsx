import React, { useState } from 'react';
import { generateIdentity, hashData } from '../utils/crypto';

const Login = () => {
    const [username, setUsername] = useState('');
    const [phase, setPhase] = useState('input'); // input, display
    const [identity, setIdentity] = useState(null);

    const handleGenerate = () => {
        if (!username.trim()) return;
        const id = generateIdentity();
        setIdentity(id);
        setPhase('display');
    };

    const handleLogin = () => {
        // TODO: Connect to backend authentication
        console.log("Logging in with identity:", identity.address);
        // For now we just alert
        alert(`Welcome, Commander ${username}.`);
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
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center'
            }}>
                <h1 className="cyber-text-neon" style={{ marginBottom: '2rem' }}>
                    GrapFene
                    <span style={{ fontSize: '0.4em', display: 'block', letterSpacing: '2px', color: '#fff' }}>
                        FEDERALIZED NETWORK
                    </span>
                </h1>

                {phase === 'input' && (
                    <div className="input-phase">
                        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Initialize Secure Uplink. Enter designation.</p>
                        <input
                            type="text"
                            className="cyber-input"
                            placeholder="ENTER USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ marginBottom: '1.5rem' }}
                        />
                        <button className="cyber-button" onClick={handleGenerate} style={{ width: '100%' }}>
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
                            Save this mnemonic sequence. It is the ONLY way to access your account.
                            We do not store it.
                        </div>

                        <div className="mnemonic-grid">
                            {identity.mnemonic.split(' ').map((word, idx) => (
                                <div key={idx} className="mnemonic-word">
                                    <span style={{ opacity: 0.5, marginRight: '5px' }}>{idx + 1}.</span>
                                    {word}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.8em', opacity: 0.7 }}>PRIVATE KEY HASH (ADDRESS)</label>
                            <div className="cyber-input" style={{ fontSize: '0.8em', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {identity.address}
                            </div>
                        </div>

                        <button className="cyber-button" onClick={handleLogin} style={{ width: '100%', marginTop: '2rem' }}>
                            ESTABLISH CONNECTION
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
