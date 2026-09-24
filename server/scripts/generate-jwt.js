/**
 * JWT Secret Generator
 * Run this to create a secure key for your production .env file
 */
const crypto = require('crypto');

console.log('--- JWT SECURE KEY GENERATOR ---');
const secret = crypto.randomBytes(64).toString('hex');
console.log('\nCopy the following line to your .env file:\n');
console.log(`JWT_SECRET=${secret}`);
console.log('\nKeep this secret safe and never share it!\n');
