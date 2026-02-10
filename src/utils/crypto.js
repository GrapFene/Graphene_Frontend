import { ethers, pbkdf2 } from 'ethers';

// Standard BIP-39 Wordlist (English)
const getWordlist = () => ethers.wordlists.en;

/**
 * Generates a new random identity with a 9-word mnemonic (96-bit entropy)
 * @returns {Object} { mnemonic, privateKey, address }
 */
export const generateIdentity = () => {
    // Generate 12 bytes (96 bits) of entropy
    const entropy = ethers.randomBytes(12);

    // Calculate Checksum: First 3 bits of SHA256(entropy)
    const hash = ethers.sha256(entropy);
    // Take first byte of hash, convert to binary, take first 3 bits
    const hashByte = parseInt(hash.substring(2, 4), 16);
    const checksumBits = hashByte.toString(2).padStart(8, '0').substring(0, 3);

    // Convert entropy to binary string
    let entropyBits = "";
    for (let i = 0; i < entropy.length; i++) {
        entropyBits += entropy[i].toString(2).padStart(8, '0');
    }

    const fullBits = entropyBits + checksumBits;

    // Split into 9 chunks of 11 bits
    const typeWordlist = getWordlist();
    const words = [];
    for (let i = 0; i < 9; i++) {
        const bin = fullBits.substring(i * 11, (i + 1) * 11);
        const index = parseInt(bin, 2);
        words.push(typeWordlist.getWord(index));
    }

    const mnemonic = words.join(' ');

    // Validate and derive
    return restoreIdentity(mnemonic);
};

/**
 * Restores identity from mnemonic phrase (supports 9 words)
 * @param {string} mnemonic 
 * @returns {Object} { privateKey, address, mnemonic, error }
 */
export const restoreIdentity = (mnemonic) => {
    try {
        const words = mnemonic.trim().split(/\s+/);

        // Manual BIP-39 derivation for 9 words (implied 96-bit entropy)
        if (words.length === 9) {
            // 1. Convert words back to bits
            const wordlist = getWordlist();
            let bits = "";
            for (let word of words) {
                const index = wordlist.getWordIndex(word);
                if (index === -1) throw new Error("Invalid word in mnemonic");
                bits += index.toString(2).padStart(11, '0');
            }

            // 2. Separate entropy and checksum
            // 9 words * 11 bits = 99 bits
            // Entropy = 96 bits (12 bytes)
            // Checksum = 3 bits
            const entropyBits = bits.substring(0, 96);
            const checksumBits = bits.substring(96);

            // 3. Verify Checksum
            const bytes = new Uint8Array(12);
            for (let i = 0; i < 12; i++) {
                bytes[i] = parseInt(entropyBits.substring(i * 8, (i + 1) * 8), 2);
            }

            const hash = ethers.sha256(bytes);
            const hashByte = parseInt(hash.substring(2, 4), 16);
            const calculatedChecksum = hashByte.toString(2).padStart(8, '0').substring(0, 3);

            if (checksumBits !== calculatedChecksum) {
                throw new Error("Invalid mnemonic checksum");
            }

            // 4. Derive Seed using PBKDF2
            const salt = ethers.toUtf8Bytes("mnemonic"); // No passphrase support for now
            const seed = pbkdf2(ethers.toUtf8Bytes(mnemonic), salt, 2048, 64, "sha512");

            // 5. Create Wallet from Seed
            const root = ethers.HDNodeWallet.fromSeed(seed);

            return {
                mnemonic: mnemonic,
                privateKey: root.privateKey,
                address: root.address
            };
        }

        // Fallback for 12+ words (Standard)
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return {
            mnemonic: wallet.mnemonic.phrase,
            privateKey: wallet.privateKey,
            address: wallet.address
        };
    } catch (error) {
        // Return error object instead of throwing to be handled by UI
        return { error: error.message || "Invalid mnemonic phrase" };
    }
};

/**
 * Hashes data using Keccak256 (standard for Ethereum style)
 * @param {string} data 
 * @returns {string} hash
 */
export const hashData = (data) => {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
};
