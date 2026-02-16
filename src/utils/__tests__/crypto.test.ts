// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateIdentity, hashMnemonicWord, generateSalt, hashMnemonic } from '../crypto';

describe('Crypto Utilities', () => {
    it('should generate a valid identity with correct structure', () => {
        const identity = generateIdentity();

        expect(identity).toHaveProperty('mnemonic');
        expect(identity).toHaveProperty('privateKey');
        expect(identity).toHaveProperty('address');

        // Ensure mnemonic is a phrase (string) and has 12 words
        expect(typeof identity.mnemonic).toBe('string');
        const mnemonicPhrase = identity.mnemonic as string;
        expect(mnemonicPhrase.split(' ').length).toBe(12);

        // Ensure private key looks like a hex string
        expect(identity.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should consistently hash mnemonic words with salt', () => {
        const word = 'apple';
        const salt = 'test_salt_123';

        const hash1 = hashMnemonicWord(word, salt);
        const hash2 = hashMnemonicWord(word, salt);

        // Hashing should be deterministic
        expect(hash1).toBe(hash2);

        // Should be a valid keccak256 hash (64 hex chars + 0x prefix)
        expect(hash1).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should return different hashes for different words or salts', () => {
        const word = 'apple';
        const salt1 = 'salt_A';
        const salt2 = 'salt_B';

        const hashA = hashMnemonicWord(word, salt1);
        const hashB = hashMnemonicWord(word, salt2);
        const hashC = hashMnemonicWord('banana', salt1);

        expect(hashA).not.toBe(hashB);
        expect(hashA).not.toBe(hashC);
    });

    it('should generate unique random salts', () => {
        const salt1 = generateSalt();
        const salt2 = generateSalt();

        expect(salt1).not.toBe(salt2);
        expect(salt1.length).toBeGreaterThan(0);
    });

    it('should hash a full mnemonic phrase correctly', () => {
        const mnemonic = 'apple banana cherry date elder fig grape honeydew kiwi lemon mango nectarine';
        const salt = 'test_salt';

        const hashes = hashMnemonic(mnemonic, salt);

        expect(hashes).toHaveLength(12);
        expect(hashes[0]).toBe(hashMnemonicWord('apple', salt));
        expect(hashes[11]).toBe(hashMnemonicWord('nectarine', salt));
    });
});
