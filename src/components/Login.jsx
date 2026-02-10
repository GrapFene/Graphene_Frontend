import React, { useState, useEffect } from 'react';
import { generateIdentity, restoreIdentity } from '../utils/crypto';

const Login = () => {
    // Phases: 'landing', 'create', 'import', 'display', 'access'
    const [phase, setPhase] = useState('landing');
    const [identity, setIdentity] = useState(null);
    const [importMnemonic, setImportMnemonic] = useState(Array(9).fill(''));
    const [revealed, setRevealed] = useState(false);
    const [passwordSaveTriggered, setPasswordSaveTriggered] = useState(false);

    // For keychain saving
    const [tempPassword, setTempPassword] = useState('');
    const [username, setUsername] = useState('MyWallet');

    const handleCreate = () => {
        const id = generateIdentity();
        setIdentity(id);
        setTempPassword(id.mnemonic); // Set mnemonic as password for keychain
        setPhase('display');
    };

    const handleImport = () => {
        const mnemonicString = importMnemonic.join(' ');
        const result = restoreIdentity(mnemonicString);
        if (result.error) {
            alert(result.error);
            return;
        }
        setIdentity(result);
        alert(`Wallet accessed! Address: ${result.address}`);
        // Proceed to app (mock)
    };

    const handleWordChange = (index, value) => {
        const newWords = [...importMnemonic];
        newWords[index] = value;
        setImportMnemonic(newWords);
    };

    const copyToClipboard = () => {
        if (!identity) return;
        navigator.clipboard.writeText(identity.mnemonic);
        alert('Copied to clipboard');
    };

    // Keychain Logic
    // We render a hidden form when identity is generated. 
    // The user can "Save Password" when we simulate a submit or just by the browser detecting the password field.
    // To make it explicit, we can have a "Save to Keychain" button that clicks a hidden submit button.

    const saveToKeychain = (e) => {
        e.preventDefault();
        setPasswordSaveTriggered(true);
        // In a real scenario, submitting this form to a dummy endpoint or just letting the browser catch it is enough.
        // Chrome/Safari usually prompt to save when a password field is filled and a form is submitted.
        // We will just show a "Saved" toast or similar.
    };

    return (
        <div className="login-container">
            <div className="glass-panel main-panel">
                <h1 className="cyber-text-neon logo-title">
                    GrapFene
                    <span className="subtitle">FEDERALIZED NETWORK</span>
                </h1>

                {phase === 'landing' && (
                    <div className="animate-fade-in">
                        <p className="welcome-text">Select authentication method</p>
                        <div className="button-group">
                            <button className="cyber-button primary" onClick={handleCreate}>
                                Create New Wallet
                            </button>
                            <button className="cyber-button secondary" onClick={() => setPhase('import')}>
                                I have a wallet
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'display' && identity && (
                    <div className="animate-slide-up">
                        <div className="step-header">
                            <h2>Secret Recovery Phrase</h2>
                            <p>Save these 9 words in a safe place.</p>
                        </div>

                        <div className={`mnemonic-grid ${revealed ? 'revealed' : 'blurred'}`} onClick={() => setRevealed(true)}>
                            {identity.mnemonic.split(' ').map((word, idx) => (
                                <div key={idx} className="mnemonic-word-card">
                                    <span className="word-index">{idx + 1}</span>
                                    <span className="word-value">{word}</span>
                                </div>
                            ))}
                            {!revealed && (
                                <div className="blur-overlay">
                                    <span>Click to Reveal</span>
                                </div>
                            )}
                        </div>

                        <div className="actions-row">
                            <button className="icon-button" onClick={copyToClipboard} title="Copy to Clipboard">
                                📋 Copy
                            </button>

                            {/* Hidden Form for Keychain */}
                            <form className="keychain-form" onSubmit={saveToKeychain}>
                                <input
                                    type="text"
                                    name="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    className="hidden-input"
                                />
                                <input
                                    type="password"
                                    name="password"
                                    value={tempPassword}
                                    readOnly
                                    autoComplete="new-password"
                                    className="hidden-input"
                                />
                                <button type="submit" className="cyber-button small">
                                    Save to Keychain
                                </button>
                            </form>
                        </div>

                        <div className="confirmation-section">
                            <label className="cyber-checkbox">
                                <input type="checkbox" />
                                <span>I have saved my recovery phrase</span>
                            </label>
                            <button className="cyber-button primary full-width" onClick={() => alert("Wallet Created! " + identity.address)}>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'import' && (
                    <div className="animate-slide-up">
                        <button className="back-button" onClick={() => setPhase('landing')}>← Back</button>
                        <h2>Access Wallet</h2>
                        <p>Enter your 9-word recovery phrase.</p>

                        <div className="import-grid">
                            {importMnemonic.map((word, idx) => (
                                <div key={idx} className="import-word-input">
                                    <span className="input-index">{idx + 1}.</span>
                                    <input
                                        type="text"
                                        value={word}
                                        onChange={(e) => handleWordChange(idx, e.target.value)}
                                        className="cyber-input small"
                                    />
                                </div>
                            ))}
                        </div>

                        <button className="cyber-button primary full-width" onClick={handleImport} style={{ marginTop: '2rem' }}>
                            Access Wallet
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
