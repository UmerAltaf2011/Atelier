import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, env } from './lib/env.js';
import * as db from './lib/db.js';
import { sign, verify, hashPassword, checkPassword, issueCode, checkCode } from './lib/auth.js';
import { sendMail, templates, mailConfigured, mailMode } from './lib/mail.js';
import { nextQuestion, finish as finishQuiz } from './quiz.js';
import { ARCHETYPES } from './data/archetypes.js';
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
  id: u.id, email: u.email, name: u.name, guest: !u.email, verified: !!u.verified,
  createdAt: u.createdAt, savedAt: u.savedAt, state: u.state,
});
// In development without mail configured, hand the code back so the flow is testable. Never in production.
const devCode = (code) => (!mailConfigured() && process.env.NODE_ENV !== 'production' ? { devCode: code } : {});
const mailInfo = r => ({ sent: !!r.sent, mode: r.mode });
const session = u => ({ token: sign({ sub: u.id }), user: publicUser(u) });
const ipOf = req => clientIp(req) || 'x';
const validEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');

const routes = {
  'GET /api/health': async () => ({ ok: true, users: db.userCount(), ai: aiProvider(), photos: !!env('PEXELS_API_KEY'), mail: mailMode() }),

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
    if (!allow(`reg:${ipOf(req)}`, 10, 3600_000)) throw fail(429, 'Too many sign-ups from this network. Try again later.');
    const { email, password, name } = await readJson(req);
    if (!validEmail(email)) throw fail(400, 'Enter a valid email address');
    if (String(password || '').length < 8) throw fail(400, 'Password must be at least 8 characters');
    const existing = db.findByEmail(email);
    if (existing && existing.id !== user.id) throw fail(409, 'That email is already registered. Try signing in.');
    db.setEmail(user, email);
    user.passwordHash = hashPassword(password);
    user.name = String(name || '').slice(0, 60) || null;
    user.verified = false;
    const code = issueCode(user, 'verify');
    db.save();
    const r = await sendMail({ to: user.email, ...templates.verify(user.name, code) });
    return { ...session(user), mail: mailInfo(r), ...devCode(code) };
  },

  'POST /api/auth/verify': async req => {
    const user = need(req);
    const { code } = await readJson(req);
    if (!user.email) throw fail(400, 'Create an account first');
    if (user.verified) return { verified: true, user: publicUser(user) };
    if (!checkCode(user, 'verify', code)) { db.save(); throw fail(400, 'That code is wrong or expired'); }
    user.verified = true;
    db.save();
    return { verified: true, user: publicUser(user) };
  },

  'POST /api/auth/resend': async req => {
    const user = need(req);
    if (!user.email) throw fail(400, 'Create an account first');
    if (user.verified) return { verified: true };
    if (!allow(`resend:${user.id}`, 3, 600_000)) throw fail(429, 'Please wait a few minutes before requesting another code.');
    const code = issueCode(user, 'verify');
    db.save();
    const r = await sendMail({ to: user.email, ...templates.verify(user.name, code) });
    return { mail: mailInfo(r), ...devCode(code) };
  },

  'POST /api/auth/forgot': async req => {
    const { email } = await readJson(req);
    if (!allow(`forgot:${ipOf(req)}`, 5, 600_000)) throw fail(429, 'Too many requests. Try again in a few minutes.');
    const user = validEmail(email) ? db.findByEmail(email) : null;
    // Same response whether or not the account exists, so emails can't be probed.
    if (!user) return { ok: true, mail: { sent: mailConfigured(), mode: mailMode() } };
    const code = issueCode(user, 'reset');
    db.save();
    const r = await sendMail({ to: user.email, ...templates.reset(code) });
    return { ok: true, mail: mailInfo(r), ...devCode(code) };
  },

  'POST /api/auth/reset': async req => {
    const { email, code, password } = await readJson(req);
    if (!allow(`reset:${ipOf(req)}`, 10, 600_000)) throw fail(429, 'Too many attempts. Try again in a few minutes.');
    if (String(password || '').length < 8) throw fail(400, 'Password must be at least 8 characters');
    const user = validEmail(email) ? db.findByEmail(email) : null;
    if (!user || !checkCode(user, 'reset', code)) { db.save(); throw fail(400, 'That code is wrong or expired'); }
    user.passwordHash = hashPassword(password);
    user.verified = true; // they proved they own the inbox
    db.save();
    sendMail({ to: user.email, ...templates.changed() }).catch(() => {});
    return session(user);
  },

  'POST /api/auth/login': async req => {
    const { email, password } = await readJson(req);
    if (!allow(`login:${ipOf(req)}`, 15, 600_000) || !allow(`loginE:${String(email).toLowerCase()}`, 8, 600_000)) throw fail(429, 'Too many attempts. Try again in a few minutes.');
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

  // ── Style archetypes + adaptive quiz (questions differ every run) ──
  'GET /api/archetypes': async () => ({ archetypes: ARCHETYPES }),
  'POST /api/quiz/next': async req => {
    const user = need(req);
    if (!allow(`quiz:${user.id}`, 40, 60_000)) throw fail(429, 'Slow down a little.');
    const body = await readJson(req);
    const asked = (Array.isArray(body.asked) ? body.asked : []).slice(0, 10).map(a => ({ id: String(a.id || '').slice(0, 40), text: String(a.text || '').slice(0, 160) }));
    const scores = {};
    for (const [k, v] of Object.entries(body.scores || {})) if (ARCHETYPES.some(a => a.id === k)) scores[k] = Math.max(0, Math.min(60, Number(v) || 0));
    const r = await nextQuestion({ asked, scores, seen: user.quiz || { ids: [], texts: [] } });
    if (r.question && r.question.id !== 'budget') {
      user.quiz = { ids: [...(user.quiz?.ids || []), r.question.id].slice(-14), texts: [...(user.quiz?.texts || []), r.question.text].slice(-30) };
      db.save();
    }
    return r;
  },
  'POST /api/quiz/finish': async req => {
    const user = need(req);
    const body = await readJson(req);
    const scores = {};
    for (const [k, v] of Object.entries(body.scores || {})) if (ARCHETYPES.some(a => a.id === k)) scores[k] = Math.max(0, Math.min(60, Number(v) || 0));
    const set = { occasion: String(body.set?.occasion || '').slice(0, 40), budgetTier: String(body.set?.budgetTier || '').slice(0, 60), tierFilter: String(body.set?.tierFilter || '').slice(0, 30) };
    const { tierFilter, match, ...dna } = finishQuiz({ scores, set });
    user.state = mergeState(user.state, { dna });
    user.savedAt = Date.now();
    db.save();
    return { dna: user.state.dna, tierFilter, match };
  },

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
    const products = await pickProducts(`${message} ${reply}`, { rate: rates[s.currency] || 1, archetypeId: s.dna.archetypeId, country: s.location?.countryCode });

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
