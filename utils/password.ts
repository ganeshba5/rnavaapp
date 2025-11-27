/**
 * Password Hashing and Verification Utilities
 * Uses expo-crypto for secure password hashing
 */

import * as Crypto from 'expo-crypto';

/**
 * Hash a password using SHA-256
 * Note: For production, consider using bcrypt or Argon2 for better security
 * @param password - Plain text password
 * @returns Hashed password as hex string
 */
export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns true if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

