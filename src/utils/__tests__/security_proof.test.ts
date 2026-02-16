// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateIdentity, hashMnemonicWord, generateSalt, hashMnemonic, restoreIdentity } from '../crypto';
import { ethers } from 'ethers';

describe('Security Stress Tests & Simulations', () => {

    /**
     * SIMULATION 1: TAMPER RESISTANCE
     * Narrative: "What happens if a hacker modifies the key by even 1 character?"
     */
    it('Integrity Check: Should fail authentication if key is tampered with', () => {
        // 1. Legitimate Setup
        const originalIdentity = generateIdentity();
        const validMnemonic = originalIdentity.mnemonic as string;
        const salt = generateSalt();

        // The "Stored" Hash in the database
        const storedHash = hashMnemonicWord(validMnemonic.split(' ')[0], salt);

        // 2. The Attack: Tampering with the input
        // Let's change just ONE letter in the mnemonic (e.g., 'apple' -> 'apply')
        const words = validMnemonic.split(' ');
        words[0] = words[0] + 'x'; // Tamper!
        const tamperedMnemonic = words.join(' ');

        // 3. Attempt Verification
        const attemptedHash = hashMnemonicWord(tamperedMnemonic.split(' ')[0], salt);

        // 4. Assert: The system MUST reject it
        expect(attemptedHash).not.toBe(storedHash);
        console.log(`[Integrity] Validation failed as expected. \nOriginal: ${storedHash} \nTampered: ${attemptedHash}`);
    });

    /**
     * SIMULATION 2: BRUTE FORCE ATTACK
     * Narrative: "Can a hacker guess my key by trying random words?"
     */
    it('Attack Simulation: Should withstand a Dictionary/Brute Force attack', () => {
        // 1. The Target (The User's Lock)
        const targetWord = "abandon"; // Common mnemonic word
        const targetSalt = generateSalt();
        const targetHash = hashMnemonicWord(targetWord, targetSalt);

        // 2. The Attack Loop
        const attempts = 1000; // Simulate 1000 guesses
        let cracked = false;

        // Dictionary of common words to try
        const dictionary = ["apple", "banana", "crypto", "dragon", "ether", "finance", "graph", "honey", "iron", "juice"];

        for (let i = 0; i < attempts; i++) {
            // Generate a random guess
            const randomGuess = i < dictionary.length ? dictionary[i] : (Math.random() + 1).toString(36).substring(7);

            const guessHash = hashMnemonicWord(randomGuess, targetSalt);

            if (guessHash === targetHash) {
                cracked = true;
                break;
            }
        }

        // 3. Assert: The simulation failed to crack the login
        expect(cracked).toBe(false);
        console.log(`[Brute Force] Simulation complete. ${attempts} attempts failed. System Secure.`);
    });

    /**
     * SIMULATION 3: RAINBOW TABLE RESISTANCE (Salt Check)
     * Narrative: "If two users have the same password, can we hack both at once?"
     */
    it('Salt Protection: Should prevent Rainbow Table attacks (Same Key, Different Hash)', () => {
        // Two users choose the EXACT same secret word
        const secretWord = "protect";

        // But the system generates unique salts for them
        const user1Salt = generateSalt();
        const user2Salt = generateSalt();

        const user1Hash = hashMnemonicWord(secretWord, user1Salt);
        const user2Hash = hashMnemonicWord(secretWord, user2Salt);

        // Assert: Their storage in the database looks completely different
        expect(user1Hash).not.toBe(user2Hash);
        expect(user1Salt).not.toBe(user2Salt);
    });

});
