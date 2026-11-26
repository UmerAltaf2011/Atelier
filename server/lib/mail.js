// Transactional email with zero dependencies.
//   Option A (easiest): RESEND_API_KEY + MAIL_FROM            -> https://resend.com
//   Option B: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
//             (Gmail: smtp.gmail.com / 465 / your address / an App Password)
// With neither, emails are written to server/storage/outbox.log and the console so the app
// still works in development (the API also returns the code, but never when NODE_ENV=production).
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, env } from './env.js';
import { fetchJson } from './http.js';

export const mailMode = () => (env('RESEND_API_KEY') ? 'resend' : env('SMTP_HOST') ? 'smtp' : 'dev');
export const mailConfigured = () => mailMode() !== 'dev';
const fromAddr = () => env('MAIL_FROM') || env('SMTP_USER') || 'Atelier <onboarding@resend.dev>';
const bare = a => (String(a).match(/<([^>]+)>/) || [, a])[1].trim();
const clean = s => String(s).replace(/[\r\n]+/g, ' ');

function smtpSend({ to, subject, text, html }) {
  const host = env('SMTP_HOST'), port = Number(env('SMTP_PORT', '465'));
  const secure = env('SMTP_SECURE', port === 465 ? 'true' : 'false') === 'true';
  const startTls = !secure && env('SMTP_STARTTLS', port === 587 ? 'true' : 'false') === 'true';
  const user = env('SMTP_USER'), pass = env('SMTP_PASS');

  return new Promise((resolve, reject) => {
    let sock, buf = '', waiting = null, finished = false;
    const done = (err) => {
      if (finished) return;
      finished = true;
      try { sock?.destroy(); } catch { /* ignore */ }
      err ? reject(err) : resolve();
    };
    const timer = setTimeout(() => done(new Error('SMTP timeout')), 20_000);
    const onData = d => {
      buf += d.toString('utf8');
      const lines = buf.split('\r\n');
      buf = lines.pop();
      for (const line of lines) {
        if (/^\d{3} /.test(line) && waiting) { const w = waiting; waiting = null; w(line); }
      }
    };
    const attach = s => { sock = s; s.on('data', onData); s.on('error', done); };
    const reply = () => new Promise(res => { waiting = res; });
    const cmd = async (line, ok) => {
      sock.write(`${line}\r\n`);
      const r = await reply();
      if (!ok.some(c => r.startsWith(c))) throw new Error(`SMTP: ${r}`);
      return r;
    };

    (async () => {
      const first = reply();
      attach(secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port }));
      const greet = await first;
      if (!greet.startsWith('220')) throw new Error(`SMTP: ${greet}`);
      await cmd('EHLO atelier.local', ['250']);
      if (startTls) {
        await cmd('STARTTLS', ['220']);
        sock.removeAllListeners('data');
        attach(tls.connect({ socket: sock, servername: host }));
        await cmd('EHLO atelier.local', ['250']);
      }
      if (user && pass) {
        await cmd('AUTH LOGIN', ['334']);
        await cmd(Buffer.from(user).toString('base64'), ['334']);
        await cmd(Buffer.from(pass).toString('base64'), ['235']);
      }
      await cmd(`MAIL FROM:<${bare(fromAddr())}>`, ['250']);
      await cmd(`RCPT TO:<${bare(to)}>`, ['250', '251']);
      await cmd('DATA', ['354']);
      const boundary = `b_${Date.now().toString(36)}`;
      const body = [
        `From: ${clean(fromAddr())}`, `To: ${clean(to)}`, `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`, '',
        `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
        Buffer.from(text).toString('base64').replace(/(.{76})/g, '$1\r\n'),
        `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
        Buffer.from(html).toString('base64').replace(/(.{76})/g, '$1\r\n'),
        `--${boundary}--`,
      ].join('\r\n');
      sock.write(`${body}\r\n.\r\n`);
      const r = await reply();
      if (!r.startsWith('250')) throw new Error(`SMTP: ${r}`);
      try { sock.write('QUIT\r\n'); } catch { /* ignore */ }
    })().then(() => { clearTimeout(timer); done(); }, e => { clearTimeout(timer); done(e); });
  });
}

export async function sendMail({ to, subject, text, html }) {
  const mode = mailMode();
  try {
    if (mode === 'resend') {
      await fetchJson('https://api.resend.com/emails', {
        method: 'POST', timeout: 15_000,
        headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: fromAddr(), to: [to], subject, text, html }),
      });
      return { sent: true, mode };
    }
    if (mode === 'smtp') { await smtpSend({ to, subject, text, html }); return { sent: true, mode }; }
  } catch (e) {
    console.error(`[mail:${mode}] failed:`, e.message);
    return { sent: false, mode, error: e.message };
  }
  const entry = `\n--- ${new Date().toISOString()} → ${to}\nSubject: ${subject}\n${text}\n`;
  console.log(`[mail:dev]${entry}`);
  try {
    const dir = path.resolve(ROOT, env('DATA_DIR', 'server/storage'));
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'outbox.log'), entry);
  } catch { /* ignore */ }
  return { sent: false, mode: 'dev' };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shell = (title, inner) => `<!doctype html><html><body style="margin:0;background:#fff6ec;font-family:Arial,sans-serif;color:#1d1030">
<div style="max-width:480px;margin:0 auto;padding:32px 24px"><div style="font-size:26px;font-weight:700">atelier<span style="color:#ff5d8f">.</span></div>
<div style="background:#fff;border-radius:20px;padding:28px;margin-top:18px"><h2 style="margin:0 0 12px">${esc(title)}</h2>${inner}</div>
<p style="font-size:12px;color:#6f6286;margin-top:18px">If you didn't request this, you can safely ignore this email.</p></div></body></html>`;
const codeBox = c => `<p style="font-size:34px;letter-spacing:8px;font-weight:700;background:#ffe4cf;border-radius:12px;padding:14px;text-align:center;margin:18px 0">${esc(c)}</p>`;

export const templates = {
  verify: (name, code) => ({
    subject: `Your Atelier verification code: ${code}`,
    text: `Hi ${name || 'there'},\n\nWelcome to Atelier! Your verification code is ${code}. It expires in 15 minutes.\n`,
    html: shell(`Welcome${name ? `, ${name}` : ''}!`, `<p>Enter this code in the app to verify your email:</p>${codeBox(code)}<p>It expires in 15 minutes.</p>`),
  }),
  reset: (code) => ({
    subject: `Reset your Atelier password: ${code}`,
    text: `Your Atelier password reset code is ${code}. It expires in 15 minutes.\n`,
    html: shell('Reset your password', `<p>Use this code to choose a new password:</p>${codeBox(code)}<p>It expires in 15 minutes.</p>`),
  }),
  changed: () => ({
    subject: 'Your Atelier password was changed',
    text: 'Your Atelier password was just changed. If this was not you, reset it again right away.\n',
    html: shell('Password changed', '<p>Your password was just changed. If this was not you, reset it again right away.</p>'),
  }),
};
