#!/usr/bin/env node
// Prints the SHA-256 hash of a password for VITE_SITE_PASSWORD_HASH.
// Usage: node scripts/hash-password.mjs "our password"
import { createHash } from 'node:crypto'

const password = process.argv.slice(2).join(' ')
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your password"')
  process.exit(1)
}
const hash = createHash('sha256').update(password.normalize('NFC'), 'utf8').digest('hex')
console.log(hash)
console.error(`\nAdd this line to .env.local (and to Vercel env vars):\nVITE_SITE_PASSWORD_HASH=${hash}`)
