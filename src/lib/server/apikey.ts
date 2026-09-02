import { randomBytes, createHash } from 'node:crypto';

const PREFIX = 'alk_';

/** Solo l'hash finisce nel database: la chiave in chiaro esiste solo nella risposta di `generate`. */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = PREFIX + randomBytes(24).toString('base64url');
  return { key, hash: hashApiKey(key), prefix: key.slice(0, PREFIX.length + 6) };
}
