import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import { PageHero } from '../components/street.jsx';
import useTitle from '../lib/useTitle.js';
import { timeAgo } from '../lib/format.js';
import { Reveal } from '../components/motion.jsx';

export default function Account() {
  useTitle('Account — Atelier');
  const { user, state, saveStatus, online, register, login, logout, deleteAccount, verifyEmail, resendCode, forgotPassword, resetPassword, toast, fmt } = useApp();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [resetStage, setResetStage] = useState('email'); // email -> code (forgot-password flow)

  const noteMail = r => {
    setDevCode(r.devCode || '');
    if (r.mail && !r.mail.sent && r.mail.mode !== 'dev') setInfo('We could not send the email right now. Try again in a minute.');
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const r = await register(form.email, form.password, form.name);
        noteMail(r);
        setInfo(r.mail?.sent ? `We emailed a 6-digit code to ${form.email}.` : '');
      } else if (mode === 'login') {
        await login(form.email, form.password);
      } else if (mode === 'forgot') {
        const r = await forgotPassword(form.email);
        noteMail(r);
        setResetStage('code');
        setMode('reset');
        setInfo('If that email has an account, a reset code is on its way.');
        return;
      } else if (mode === 'reset') {
        await resetPassword(form.email, code, newPw);
        setCode(''); setNewPw(''); setMode('login');
      }
      setForm({ name: '', email: '', password: '' });
    } catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setBusy(false); }
  };

  const exportData = async () => {
    try {
      const data = await api('/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'atelier-data.json' });
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast('Could not export right now'); }
  };
  const remove = async () => {
    if (window.confirm('Delete your account and all saved data? This cannot be undone.')) {
      try { await deleteAccount(); } catch { toast('Could not delete right now'); }
    }
  };

  const verify = async e => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await verifyEmail(code); setCode(''); setDevCode(''); setInfo(''); }
    catch (err) { setError(err.message || 'That code did not work'); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setError('');
    try { const r = await resendCode(); noteMail(r); setInfo(r.mail?.sent ? 'A new code is on its way.' : ''); }
    catch (err) { setError(err.message || 'Could not resend'); }
  };

  const guest = !user || user.guest;
  return (
    <>
      <PageHero variant="id" kicker="Account" lines={guest ? [['KEEP IT', ''], ['FOREVER.', 'tag']] : [['HELLO,', ''], [(user.name || user.email.split('@')[0]).toUpperCase().slice(0, 12) + '.', 'tag']]}
        sub={<p className="lead">{guest ? "You're a guest and everything is already auto-saved. Create an account to open the same rack on any device."
              : `Signed in as ${user.email}. Your rack is synced to every device.`}</p>}
        card={<><small>ATELIER ID</small><b>{guest ? 'GUEST' : (user.name || user.email.split('@')[0]).toUpperCase()}</b><span>{guest ? 'auto-saved on this device' : 'synced everywhere'}</span><i className="barcode"></i></>} />

      <section className="section tight two-col top">
        <Reveal className="panel">
          {!guest && !user.verified && (
            <form className="verify-box" onSubmit={verify}>
              <b>Verify your email</b>
              <span className="small muted">Enter the 6-digit code we sent to {user.email}.</span>
              <input className="code-input" inputMode="numeric" maxLength={6} placeholder="••••••" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
              {devCode && <span className="dev-note">Dev mode (no email provider configured): your code is <b>{devCode}</b>. Add SMTP or Resend keys to send real emails.</span>}
              {error && <p className="form-error">{error}</p>}
              {info && <p className="small muted">{info}</p>}
              <div className="panel-actions">
                <button className="btn btn-solid btn-sm" disabled={busy || code.length !== 6}>Verify</button>
                <button type="button" className="link-btn small" onClick={resend}>Send a new code</button>
              </div>
            </form>
          )}
          {!guest && user.verified && <div className="verify-box ok"><b>Email verified ✓</b><span className="small muted">{user.email}</span></div>}
          <h3>Your saved data</h3>
          <ul className="data-list">
            <li><span>Saved pieces</span><b>{state.saved.length}</b></li>
            <li><span>Saved looks</span><b>{state.outfits.length}</b></li>
            <li><span>Wardrobe value</span><b>{fmt(state.saved.reduce((s, i) => s + i.priceUsd, 0))}</b></li>
            <li><span>Style DNA</span><b>{state.dna.completed ? state.dna.archetype : 'Not taken yet'}</b></li>
            <li><span>Location</span><b>{state.location ? `${state.location.city}, ${state.location.countryCode}` : '—'}</b></li>
            <li><span>Currency</span><b>{state.currency}{state.currencyAuto ? ' (auto)' : ''}</b></li>
            <li><span>Last auto-save</span><b>{!online ? 'Offline: saved on this device' : saveStatus.state === 'saving' ? 'Saving…' : timeAgo(saveStatus.at)}</b></li>
          </ul>
          <div className="panel-actions">
            <button className="btn btn-line btn-sm" onClick={exportData}><Download size={14} /> Export my data</button>
            {!guest && <button className="btn btn-line btn-sm" onClick={logout}><LogOut size={14} /> Sign out</button>}
            <button className="btn btn-line btn-sm danger" onClick={remove}><Trash2 size={14} /> Delete account</button>
          </div>
        </Reveal>

        {guest && (
          <Reveal className="panel" delay={0.1}>
            <div className="tabs">
              <button className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); setInfo(''); }}>Create account</button>
              <button className={mode === 'login' || mode === 'forgot' || mode === 'reset' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); setInfo(''); setResetStage('email'); }}>Sign in</button>
            </div>
            <form onSubmit={submit} className="form">
              {mode === 'register' && <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" />}
              <input type="email" required placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              {(mode === 'register' || mode === 'login') && (
                <input type="password" required minLength={8} placeholder="Password (8+ characters)" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              )}
              {(mode === 'forgot' || mode === 'reset') && resetStage === 'code' && (
                <>
                  <input className="code-input" inputMode="numeric" maxLength={6} required placeholder="••••••" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
                  <input type="password" required minLength={8} placeholder="New password (8+ characters)" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
                </>
              )}
              {devCode && (mode === 'forgot' || mode === 'reset') && <span className="dev-note">Dev mode (no email provider configured): your reset code is <b>{devCode}</b>.</span>}
              {info && <p className="small muted">{info}</p>}
              {error && <motion.p className="form-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>}
              <button className="btn btn-solid" disabled={busy || !online}>{busy ? 'One moment…' : mode === 'register' ? 'Create my account' : mode === 'login' ? 'Sign in' : resetStage === 'email' ? 'Email me a reset code' : 'Set new password'}</button>
              {mode === 'login' && (
                <p className="muted small">Signing in loads that account's wardrobe on this device. <button type="button" className="link-btn" onClick={() => { setMode('forgot'); setResetStage('email'); setError(''); setInfo(''); }}>Forgot password?</button></p>
              )}
              {!online && <p className="muted small">The server is unreachable, so accounts are unavailable right now.</p>}
            </form>
          </Reveal>
        )}
      </section>
    </>
  );
}
