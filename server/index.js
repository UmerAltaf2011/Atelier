import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, env } from './lib/env.js';
import * as db from './lib/db.js';
import { sign, verify, hashPassword, checkPassword } from './lib/auth.js';
import { send, readJson, clientIp, isPrivateIp, allow } from './lib/http.js';
import { getAllProducts, queryProducts, brandDirectory } from './providers/index.js';
import { getRates, reverseGeocode, ipLocation, searchPlaces, getWeather } from './providers/world.js';
import { fetchEditorial } from './providers/pexels.js';
import { stylistReply, pickProducts, aiProvider } from './ai.js';
import { mergeState } from './state.js';
import { BRANDS } from './data/brands.js';
import { memo } from './lib/cache.js';

const DIST = path.join(ROOT, 'dist');
const fail = (status, message) => Object.assign(new Error(message), { status });

const authUser = req => {
  const h = req.headers.authorization || '';
  const payload = verify(h.startsWith('Bearer ') ? h.slice(7) : '');
  return payload ? db.getUser(payload.sub) : null;
};
const need = req => authUser(req) || (() => { throw fail(401, 'Not signed in'); })();
const publicUser = u => ({
  id: u.id, email: u.email, name: u.name, guest: !u.email, createdAt: u.createdAt, savedAt: u.savedAt, state: u.state,
});
const session = u => ({ token: sign({ sub: u.id }), user: publicUser(u) });
const validEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');

const routes = {
  'GET /api/health': async () => ({ ok: true, users: db.userCount(), ai: aiProvider(), photos: !!env('PEXELS_API_KEY') }),

  'GET /api/stats': async () => {
    const [{ items, live }, rates] = await Promise.all([getAllProducts(), getRates()]);
    return {
      brands: BRANDS.length, products: items.length, currencies: Object.keys(rates.rates).length,
      countries: new Set(BRANDS.map(b => b.country)).size, catalogueLive: live, ratesLive: rates.live,
    };
  },

  'GET /api/rates': async () => getRates(),
  'GET /api/catalogue': async (req, url) => queryProducts(Object.fromEntries(url.searchParams)),
  'GET /api/brands': async () => ({ brands: await brandDirectory() }),

  'GET /api/editorial': async () =>
    memo('editorial', 30 * 60_000, async () => {
      let photos = [];
      try { photos = await fetchEditorial(); } catch (e) { console.warn('[pexels]', e.message); }
      if (photos.length) return { photos, source: 'Pexels' };
      const { items } = await getAllProducts();
      const withImg = items.filter(i => i.image).sort((a, b) => b.rating - a.rating).slice(0, 30);
      return { source: 'catalogue', photos: withImg.map(i => ({ src: i.image, alt: i.name, credit: i.brand })) };
    }),

  'GET /api/geo/ip': async req => {
    const ip = clientIp(req);
    const location = await ipLocation(isPrivateIp(ip) ? '' : ip);
    return { location, currency: location.currency };
  },
  'GET /api/geo/context': async (req, url) => {
    const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw fail(400, 'lat and lon required');
    const location = await reverseGeocode(lat, lon);
    return { location, currency: location.currency };
  },
  'GET /api/geo/search': async (req, url) => {
    const q = (url.searchParams.get('q') || '').trim();
    if (q.length < 2) return { results: [] };
    return { results: await searchPlaces(q) };
  },
  'GET /api/weather': async (req, url) => {
    const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw fail(400, 'lat and lon required');
    return getWeather(lat, lon);
  },

  // ── Accounts: everyone starts as an auto-created guest; register upgrades it in place ──
  'POST /api/auth/guest': async () => session(db.createUser()),

  'POST /api/auth/register': async req => {
    const user = need(req);
    const { email, password, name } = await readJson(req);
    if (!validEmail(email)) throw fail(400, 'Enter a valid email address');
    if (String(password || '').length < 8) throw fail(400, 'Password must be at least 8 characters');
    const existing = db.findByEmail(email);
    if (existing && existing.id !== user.id) throw fail(409, 'That email is already registered. Try signing in.');
    db.setEmail(user, email);
    user.passwordHash = hashPassword(password);
    user.name = String(name || '').slice(0, 60) || null;
    db.save();
    return session(user);
  },

  'POST /api/auth/login': async req => {
    const { email, password } = await readJson(req);
    const user = db.findByEmail(email || '');
    if (!user || !checkPassword(String(password || ''), user.passwordHash)) throw fail(401, 'Wrong email or password');
    return session(user);
  },

  'GET /api/me': async req => {
    const user = need(req);
    user.lastSeen = Date.now();
    db.save();
    return { user: publicUser(user) };
  },
  'PUT /api/me/state': async req => {
    const user = need(req);
    user.state = mergeState(user.state, await readJson(req));
    user.savedAt = Date.now();
    db.save();
    return { savedAt: user.savedAt };
  },
  'GET /api/me/export': async req => {
    const { passwordHash, ...rest } = need(req);
    return rest;
  },
  'DELETE /api/me': async req => { db.deleteUser(need(req)); return { deleted: true }; },

  // ── AI stylist ──
  'GET /api/chat/history': async req => ({ messages: need(req).chat.slice(-60) }),
  'DELETE /api/chat/history': async req => { const u = need(req); u.chat = []; db.save(); return { cleared: true }; },
  'POST /api/chat': async req => {
    const user = need(req);
    if (!allow(`chat:${user.id}`, 20, 60_000)) throw fail(429, 'Slow down a little: try again in a moment.');
    const body = await readJson(req);
    const message = String(body.message || '').trim().slice(0, 600);
    if (!message) throw fail(400, 'Say something first');

    const s = user.state;
    let weather = null;
    const w = body.context?.weather;
    if (w && Number.isFinite(Number(w.tempC))) {
      weather = { tempC: Number(w.tempC), summary: String(w.summary || '').slice(0, 40), advice: String(w.advice || '').slice(0, 200) };
    } else if (s.location) {
      try { weather = await getWeather(s.location.lat, s.location.lon); } catch { /* optional */ }
    }
    const rates = (await getRates()).rates;
    const ctx = {
      dna: s.dna, currency: s.currency, city: s.location?.city || '', weather,
      saved: s.saved.map(i => `${i.brand} ${i.name}`),
    };
    const { reply, source } = await stylistReply({ message, history: user.chat, ctx });
    const products = await pickProducts(`${message} ${reply}`, { rate: rates[s.currency] || 1 });

    const now = Date.now();
    user.chat.push({ role: 'user', content: message, ts: now });
    user.chat.push({ role: 'assistant', content: reply, products, source, ts: now + 1 });
    if (user.chat.length > 200) user.chat = user.chat.slice(-200);
    db.save();
    return { reply, products, source };
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain',
};

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(DIST)) {
    return send(res, 404, 'Frontend not built yet. Run "npm run build", or use "npm run dev" and open http://localhost:5173');
  }
  let file = path.join(DIST, decodeURIComponent(pathname));
  if (!file.startsWith(DIST)) return send(res, 403, 'Forbidden');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html'); // SPA fallback
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);

  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) return send(res, 404, { error: 'Not found' });
  try {
    send(res, 200, await handler(req, url));
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(`[${req.method} ${url.pathname}]`, err);
    send(res, status, { error: status >= 500 ? 'Something went wrong on our side' : err.message });
  }
});

if (!process.env.ATELIER_NO_LISTEN) {
  const port = Number(env('PORT', '8787'));
  server.listen(port, () => {
    console.log(`\n  Atelier API  →  http://localhost:${port}`);
    console.log(`  AI stylist   →  ${aiProvider()}`);
    console.log(`  Editorial    →  ${env('PEXELS_API_KEY') ? 'Pexels photos' : 'live catalogue images (set PEXELS_API_KEY for editorial photos)'}\n`);
  });
}
