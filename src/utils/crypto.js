import { ethers } from 'ethers';

/**
 * Generates a new random identity
 * @returns {Object} { mnemonic, privateKey, address }
 */
export const generateIdentity = () => {
    const wallet = ethers.Wallet.createRandom();
    return {
        mnemonic: wallet.mnemonic.phrase,
        privateKey: wallet.privateKey,
        address: wallet.address
    };
};

/**
 * Restores identity from mnemonic phrase
 * @param {string} mnemonic 
 * @returns {Object} { privateKey, address, error }
 */
export const restoreIdentity = (mnemonic) => {
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
 * @param {string} data 
 * @returns {string} hash
 */
export const hashData = (data) => {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
};
