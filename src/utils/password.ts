import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes(':')) {
    // Legacy plain-text password (pre-hash). Verified directly so existing
    // users keep working; login re-hashes it once verified.
    return password === stored;
  }
  const [salt, storedHash] = stored.split(':');
  const computedHash = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(storedHash), Buffer.from(computedHash));
}

export function isLegacyPassword(stored: string): boolean {
  return !stored.includes(':');
}