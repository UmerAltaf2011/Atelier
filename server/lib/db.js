// A small, dependency-free JSON database. Every change is flushed to disk
// (atomic write), so user data survives restarts. Swap this one file for
// Postgres / MongoDB / SQLite when you outgrow it: the rest of the app only
// uses the functions exported here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, env } from './env.js';

const dir = path.resolve(ROOT, env('DATA_DIR', 'server/storage'));
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'db.json');

let data = { meta: {}, users: {}, emails: {} };
try { data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { /* first run */ }

function flushNow() {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

let timer = null;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { flushNow(); } catch (e) { console.error('[db] write failed:', e.message); }
  }, 250);
}

if (!data.meta.secret) { data.meta.secret = crypto.randomBytes(32).toString('hex'); flushNow(); }
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { try { flushNow(); } catch { /* ignore */ } process.exit(0); });
}

export const secret = () => env('JWT_SECRET') || data.meta.secret;

export const defaultState = () => ({
  dna: {
    archetype: 'Architectural Minimalist',
    palette: 'Obsidian, Bone & Raw Camel',
    swatches: ['#14110f', '#e9e0d0', '#b98c5a'],
    silhouette: 'Relaxed Tailoring',
    occasion: 'Everyday',
    budgetTier: 'Contemporary & Luxury',
    completed: false,
  },
  saved: [],
  outfits: [],
  currency: 'USD',
  currencyAuto: true,
  location: null,
  prefs: { liveLocation: false },
});

export function createUser() {
  const user = {
    id: `u_${crypto.randomBytes(8).toString('hex')}`,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    email: null,
    name: null,
    passwordHash: null,
    state: defaultState(),
    savedAt: null,
    chat: [],
  };
  data.users[user.id] = user;
  save();
  return user;
}

export const getUser = id => data.users[id] || null;
export const findByEmail = email => {
  const id = data.emails[String(email).toLowerCase()];
  return id ? data.users[id] : null;
};
export function setEmail(user, email) {
  if (user.email) delete data.emails[user.email];
  user.email = String(email).toLowerCase();
  data.emails[user.email] = user.id;
  save();
}
export function deleteUser(user) {
  if (user.email) delete data.emails[user.email];
  delete data.users[user.id];
  save();
}
export const userCount = () => Object.keys(data.users).length;
