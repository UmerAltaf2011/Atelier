import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, LocateFixed, MapPin, Menu, Radio, Search, Sparkles, User, X } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import { useDebounced } from '../lib/hooks.js';
import { flag } from '../lib/format.js';

const LINKS = [
  ['/shop', 'Discover'], ['/brands', 'Brands'], ['/wardrobe', 'Wardrobe'], ['/quiz', 'Style quiz'], ['/about', 'About'],
];

function LocationPopover({ onClose }) {
  const { state, weather, syncLocation, applyLocation, updateState } = useApp();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 350);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const loc = state.location;

  useEffect(() => {
    if (dq.trim().length < 2) { setResults([]); return undefined; }
    let off = false;
    api(`/geo/search?q=${encodeURIComponent(dq)}`).then(r => !off && setResults(r.results)).catch(() => !off && setResults([]));
    return () => { off = true; };
  }, [dq]);

  return (
    <motion.div className="popover" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}>
      <div className="popover-head">
        <b>{loc ? `${flag(loc.countryCode)} ${loc.city}` : 'Locating…'}</b>
        <span>{loc ? [loc.region, loc.country].filter(Boolean).join(', ') : ''}{loc?.approximate ? ' · approximate' : ''}</span>
        {weather && <span className="pop-weather">{weather.tempC}°C · {weather.summary}</span>}
      </div>
      <button className="btn btn-solid btn-sm" disabled={busy} onClick={async () => { setBusy(true); await syncLocation(); setBusy(false); onClose(); }}>
        <LocateFixed size={15} /> {busy ? 'Locating…' : 'Use my precise location'}
      </button>
      <label className="toggle-row">
        <span><Radio size={14} /> Live sync while I travel</span>
        <input type="checkbox" checked={state.prefs.liveLocation}
          onChange={e => updateState(s => ({ prefs: { ...s.prefs, liveLocation: e.target.checked } }))} />
      </label>
      <label className="search-field">
        <Search size={15} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Or search any city in the world…" />
      </label>
      {!!results.length && (
        <ul className="place-list">
          {results.map(r => (
            <li key={`${r.lat},${r.lon}`}>
              <button onClick={() => { applyLocation(r); onClose(); }}>
                {flag(r.countryCode)} <b>{r.city}</b> <span>{[r.region, r.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export default function Nav() {
  const { state, rates, setCurrencyOpen, openChat } = useApp();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenu(false); setLocOpen(false); }, [pathname]);
  useEffect(() => {
    if (!locOpen) return undefined;
    const close = e => { if (wrap.current && !wrap.current.contains(e.target)) setLocOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [locOpen]);

  const loc = state.location;
  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}${pathname === '/' && !scrolled ? ' on-dark' : ''}`}>
      <Link to="/" className="logo">ATELIER<span>.</span></Link>

      <nav className="nav-links" aria-label="Main">
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
            {to === '/wardrobe' && state.saved.length > 0 && <span className="badge">{state.saved.length}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="nav-tools">
        <div className="loc-wrap" ref={wrap}>
          <button className="pill" onClick={() => setLocOpen(o => !o)} aria-expanded={locOpen} aria-label="Change location">
            <MapPin size={15} />
            <span className="pill-text">{loc ? loc.city : 'Locating…'}</span>
            {state.prefs.liveLocation && <i className="live-dot"></i>}
          </button>
          <AnimatePresence>{locOpen && <LocationPopover onClose={() => setLocOpen(false)} />}</AnimatePresence>
        </div>
        <button className="pill" onClick={() => setCurrencyOpen(true)} aria-label="Change currency">
          <Globe size={15} />
          <span className="pill-text">{rates.rates[state.currency] ? state.currency : 'USD'}</span>
        </button>
        <button className="pill pill-accent" onClick={() => openChat()} aria-label="Open AI stylist">
          <Sparkles size={15} /> <span className="pill-text">Stylist</span>
        </button>
        <Link to="/account" className="pill icon-only" aria-label="Account"><User size={16} /></Link>
        <button className="pill icon-only menu-btn" onClick={() => setMenu(m => !m)} aria-label="Menu">
          {menu ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div className="mobile-menu" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {LINKS.map(([to, label], i) => (
              <motion.div key={to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <NavLink to={to}>{label}</NavLink>
              </motion.div>
            ))}
            <Link to="/account">Account</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
