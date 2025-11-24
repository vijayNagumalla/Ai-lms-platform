#!/usr/bin/env node

/**
 * Key Generation Script
 * 
 * This script generates secure random keys for:
 * - CSRF_SECRET (CSRF Protection Key)
 * - ENCRYPTION_KEY (Encryption Key)
 * - SUPER_ADMIN_REGISTRATION_CODE (Super Admin Registration Code)
 * 
 * Usage: node backend/scripts/generate-keys.js
 */

import crypto from 'crypto';

/**
 * Generate a secure random key
 * @param {number} length - Length of the key in bytes (default: 32 bytes = 64 hex characters)
 * @param {string} encoding - Encoding format (default: 'hex')
 * @returns {string} Secure random key
 */
function generateSecureKey(length = 32, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * Generate a secure random key with base64 encoding (more compact)
 * @param {number} length - Length of the key in bytes (default: 32 bytes)
 * @returns {string} Secure random key in base64 format
 */
function generateSecureKeyBase64(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate a secure random key with URL-safe base64 encoding
 * @param {number} length - Length of the key in bytes (default: 32 bytes)
 * @returns {string} Secure random key in URL-safe base64 format
 */
function generateSecureKeyUrlSafe(length = 32) {
  return crypto.randomBytes(length).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

console.log('\n🔐 Generating Secure Keys for LMS Platform\n');
console.log('='.repeat(60));
console.log('\n📋 Copy these values to your .env file:\n');

// Generate CSRF Protection Key (64 hex characters = 32 bytes)
const csrfSecret = generateSecureKey(32, 'hex');
console.log('CSRF_SECRET=' + csrfSecret);
console.log('   → CSRF Protection Key (64 hex characters)\n');

// Generate Encryption Key (64 hex characters = 32 bytes)
const encryptionKey = generateSecureKey(32, 'hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('   → Encryption Key (64 hex characters)\n');

// Generate Super Admin Registration Code (64 hex characters = 32 bytes)
const superAdminCode = generateSecureKey(32, 'hex');
console.log('SUPER_ADMIN_REGISTRATION_CODE=' + superAdminCode);
console.log('   → Super Admin Registration Code (64 hex characters)\n');

console.log('='.repeat(60));
console.log('\n✅ All keys generated successfully!');
console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Keep these keys SECRET and NEVER commit them to version control');
console.log('   2. Use different keys for development and production environments');
console.log('   3. Store production keys securely (e.g., environment variables, secret managers)');
console.log('   4. Each key is 64 characters long (32 bytes), which exceeds the minimum 32 character requirement');
console.log('\n📝 Next Steps:');
console.log('   1. Copy the keys above to your backend/.env file');
console.log('   2. Make sure your .env file is in .gitignore');
console.log('   3. Restart your backend server after updating .env\n');

