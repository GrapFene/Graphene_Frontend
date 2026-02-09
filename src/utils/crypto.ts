import { ethers } from 'ethers';

/**
 * Generates a new random identity
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
 */
export const hashData = (data: string) => {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Hashes a mnemonic word with a salt for secure storage
 */
export const hashMnemonicWord = (word: string, salt: string) => {
    return ethers.keccak256(ethers.toUtf8Bytes(`${word}:${salt}`));
};

/**
 * Generates an array of 12 hashes for each mnemonic word
 */
export const hashMnemonic = (mnemonic: string, salt: string) => {
    const words = mnemonic.split(' ');
    return words.map(word => hashMnemonicWord(word, salt));
};

/**
 * Generates a random salt
 */
export const generateSalt = () => {
    const randomWallet = ethers.Wallet.createRandom();
    return randomWallet.privateKey.slice(2, 34); // 32 hex chars
};
