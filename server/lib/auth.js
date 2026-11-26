import crypto from 'node:crypto';
import { secret } from './db.js';

const hmac = body => crypto.createHmac('sha256', secret()).update(body).digest('base64url');

export function sign(payload, days = 365) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 })).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const a = Buffer.from(sig), b = Buffer.from(hmac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

export function checkPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── Six-digit email codes (verify / reset). Only an HMAC is stored; 15 min expiry; 5 tries. ──
const codeHash = (userId, kind, code) => hmac(`${userId}:${kind}:${code}`);
export function issueCode(user, kind) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  user.codes = { ...(user.codes || {}), [kind]: { h: codeHash(user.id, kind, code), exp: Date.now() + 15 * 60_000, tries: 0 } };
  return code;
}
export function checkCode(user, kind, code) {
  const c = user.codes?.[kind];
  if (!c || c.exp < Date.now() || c.tries >= 5) return false;
  c.tries += 1;
  const a = Buffer.from(codeHash(user.id, kind, String(code || '').trim())), b = Buffer.from(c.h);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (ok) delete user.codes[kind];
  return ok;
}
