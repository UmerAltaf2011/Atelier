import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import useTitle from '../lib/useTitle.js';
import { timeAgo } from '../lib/format.js';
import { Reveal } from '../components/motion.jsx';

export default function Account() {
  useTitle('Account — Atelier');
  const { user, state, saveStatus, online, register, login, logout, deleteAccount, toast, fmt } = useApp();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') await register(form.email, form.password, form.name);
      else await login(form.email, form.password);
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

  const guest = !user || user.guest;
  return (
    <>
      <header className="page-head">
        <Reveal>
          <div className="eyebrow">Account</div>
          <h1 className="h1">{guest ? <>Keep it <em>forever.</em></> : <>Hello, <em>{user.name || user.email.split('@')[0]}.</em></>}</h1>
          <p className="lead">
            {guest ? "You're using Atelier as a guest and everything is already auto-saved. Create an account to open the same wardrobe on any device."
              : `Signed in as ${user.email}. Your wardrobe is synced to every device.`}
          </p>
        </Reveal>
      </header>

      <section className="section tight two-col top">
        <Reveal className="panel">
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
              <button className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
              <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            </div>
            <form onSubmit={submit} className="form">
              {mode === 'register' && <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" />}
              <input type="email" required placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              <input type="password" required minLength={8} placeholder="Password (8+ characters)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              {error && <motion.p className="form-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>}
              <button className="btn btn-solid" disabled={busy || !online}>{busy ? 'One moment…' : mode === 'register' ? 'Create my account' : 'Sign in'}</button>
              {mode === 'login' && <p className="muted small">Signing in loads that account's wardrobe on this device.</p>}
              {!online && <p className="muted small">The server is unreachable, so accounts are unavailable right now.</p>}
            </form>
          </Reveal>
        )}
      </section>
    </>
  );
}
