import { generateIdentity, restoreIdentity } from './utils/crypto.js';
import { ethers } from 'ethers';

/**
 * Crypto Verification Script
 * 
 * Functionality: Tests the generation and restoration of identities using the crypto utility.
 * Usage: Run with node to verify crypto functions.
 */
console.log("Starting Crypto Verification...");

try {
    // Test 1: Generate Identity
    console.log("\nTest 1: Generatin Identity...");
    const id = generateIdentity();
    console.log("Mnemonic:", id.mnemonic);
    console.log("Address:", id.address);

    const words = id.mnemonic.split(' ');
    if (words.length !== 9) {
        throw new Error(`Expected 9 words, got ${words.length}`);
    }
    console.log("✅ Generated 9 words");

    // Test 2: Restore Identity
    console.log("\nTest 2: Restoring Identity...");
    const restored = restoreIdentity(id.mnemonic);
    console.log("Restored Address:", restored.address);

    if (restored.address !== id.address) {
        throw new Error(`Address mismatch! Original: ${id.address}, Restored: ${restored.address}`);
    }
    console.log("✅ Restoration successful");

    // Test 3: Restore fail
    console.log("\nTest 3: Testing Invalid Mnemonic...");
    const result = restoreIdentity("invalid mnemonic phrase that is not nine words");
    if (!result.error) {
        throw new Error("Should have failed with invalid mnemonic");
    }
    console.log("✅ Invalid mnemonic handled correctly");

    console.log("\n🎉 ALL TESTS PASSED");

} catch (error) {
    console.error("\n❌ TESTS FAILED:", error);
    process.exit(1);
}
