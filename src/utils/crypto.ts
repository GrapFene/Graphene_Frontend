import { ethers } from 'ethers';

/**
 * Generates a new random identity
 * 
 * Functionality: Creates a new random Ethereum wallet and returns its mnemonic, private key, and address.
 * Input: None
 * Response: { mnemonic: string, privateKey: string, address: string }
 */
export const generateIdentity = () => {
    const wallet = ethers.Wallet.createRandom();
    return {
        mnemonic: wallet.mnemonic?.phrase,
        privateKey: wallet.privateKey,
        address: wallet.address
    };
};

/**
 * Restores identity from mnemonic phrase
 * 
 * Functionality: Recovers an Ethereum wallet from a given mnemonic phrase.
 * Input: mnemonic (string) - The 12-word mnemonic phrase.
 * Response: { privateKey: string, address: string } | { error: string }
 */
export const restoreIdentity = (mnemonic: string) => {
    try {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return {
            privateKey: wallet.privateKey,
            address: wallet.address
        };
    } catch (error) {
        return { error: "Invalid mnemonic phrase" };
    }
};

/**
 * Hashes data using Keccak256 (standard for Ethereum style)
 * 
 * Functionality: Computes the Keccak256 hash of a given string.
 * Input: data (string) - The string data to hash.
 * Response: string - The Keccak256 hash of the data.
 */
export const hashData = (data: string) => {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Hashes a mnemonic word with a salt for secure storage
 * 
 * Functionality: Hashes a single word from a mnemonic combined with a salt using Keccak256.
 * Input: word (string) - The mnemonic word.
 *        salt (string) - The salt string.
 * Response: string - The resulted hash.
 */
export const hashMnemonicWord = (word: string, salt: string) => {
    return ethers.keccak256(ethers.toUtf8Bytes(`${word}:${salt}`));
};

/**
 * Generates an array of 12 hashes for each mnemonic word
 * 
 * Functionality: Splits a mnemonic phrase into words and hashes each word with a salt.
 * Input: mnemonic (string) - The full mnemonic phrase.
 *        salt (string) - The salt string.
 * Response: string[] - An array of hashed words.
 */
export const hashMnemonic = (mnemonic: string, salt: string) => {
    const words = mnemonic.split(' ');
    return words.map(word => hashMnemonicWord(word, salt));
};

/**
 * Generates a random salt
 * 
 * Functionality: Generates a random 32-character hex string to be used as a salt.
 * Input: None
 * Response: string - A 32-character random hex string.
 */
export const generateSalt = () => {
    const randomWallet = ethers.Wallet.createRandom();
    return randomWallet.privateKey.slice(2, 34); // 32 hex chars
};
