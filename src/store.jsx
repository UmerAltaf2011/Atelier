import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ensureSession, getToken, setToken } from './lib/api.js';
import { haversineKm, money, slimItem } from './lib/format.js';

const LS = 'atelier_state_v3';

export const DEFAULT_STATE = {
  dna: {
    archetype: 'Architectural Minimalist', palette: 'Obsidian, Bone & Raw Camel',
    swatches: ['#14110f', '#e9e0d0', '#b98c5a'], silhouette: 'Relaxed Tailoring',
    occasion: 'Everyday', budgetTier: 'Contemporary & Luxury', completed: false,
  },
  saved: [], outfits: [], currency: 'USD', currencyAuto: true, location: null, prefs: { liveLocation: false },
};

const normalize = s => ({
  ...DEFAULT_STATE, ...s,
  dna: { ...DEFAULT_STATE.dna, ...(s?.dna || {}) },
  prefs: { ...DEFAULT_STATE.prefs, ...(s?.prefs || {}) },
  saved: s?.saved || [], outfits: s?.outfits || [],
});

function loadLocal() {
  try { const raw = JSON.parse(localStorage.getItem(LS)); if (raw) return normalize(raw); } catch { /* ignore */ }
  return DEFAULT_STATE;
}
const hasData = s => s.saved.length > 0 || !!s.location || s.dna.completed || s.outfits.length > 0;

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [state, setState] = useState(loadLocal);
  const [user, setUser] = useState(null);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [rates, setRates] = useState({ rates: { USD: 1 }, live: false, updated: null });
  const [weather, setWeather] = useState(null);
  const [toastState, setToastState] = useState({ msg: '', show: false });
  const [chat, setChat] = useState({ open: false, seed: '' });
  const [product, setProduct] = useState(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', at: null });

  const stateRef = useRef(state);
  stateRef.current = state;
  const hydrated = useRef(false), skipNext = useRef(false), dirty = useRef(false);
  const saveTimer = useRef(null), toastTimer = useRef(null);

  const toast = useCallback(msg => {
    setToastState({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(t => ({ ...t, show: false })), 2600);
  }, []);

  // ── Auto-save: every change is pushed to the server (debounced) and cached locally ──
  const pushState = useCallback(async (keepalive = false) => {
    if (!dirty.current || !getToken()) return;
    dirty.current = false;
    setSaveStatus(s => ({ ...s, state: 'saving' }));
    try {
      const r = await api('/me/state', { method: 'PUT', body: stateRef.current, keepalive });
      setSaveStatus({ state: 'saved', at: r.savedAt || Date.now() });
      setOnline(true);
    } catch {
      dirty.current = true;
      setSaveStatus(s => ({ ...s, state: 'error' }));
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS, JSON.stringify(state)); } catch { /* ignore */ }
    if (!hydrated.current) return;
    if (skipNext.current) { skipNext.current = false; return; }
    dirty.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => pushState(), 700);
  }, [state, pushState]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' || document.visibilityState === undefined) {
        clearTimeout(saveTimer.current);
        pushState(true);
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush); };
  }, [pushState]);

  // ── Boot: get/create the account and load saved data ──
  useEffect(() => {
    let off = false;
    ensureSession()
      .then(me => {
        if (off) return;
        const server = normalize(me.user.state), local = stateRef.current;
        hydrated.current = true;
        if (!hasData(server) && hasData(local)) { dirty.current = true; setState(s => ({ ...s })); }
        else { skipNext.current = true; setState(server); }
        setUser(me.user);
        setSaveStatus({ state: 'saved', at: me.user.savedAt });
        setOnline(true);
      })
      .catch(() => { hydrated.current = true; setOnline(false); })
      .finally(() => !off && setReady(true));
    return () => { off = true; };
  }, []);

  // ── Live exchange rates (all currencies) ──
  useEffect(() => {
    let off = false;
    const load = () => api('/rates').then(r => !off && setRates(r)).catch(() => {});
    load();
    const id = setInterval(load, 3600_000);
    return () => { off = true; clearInterval(id); };
  }, []);

  // ── Location: stored city drives weather + currency ──
  const applyLocation = useCallback(async (loc, { auto = false } = {}) => {
    let full = { ...loc };
    try {
      if (!loc.city || !loc.countryCode || !loc.currency) {
        const c = await api(`/geo/context?lat=${loc.lat}&lon=${loc.lon}`);
        full = { ...full, ...c.location };
      }
    } catch { /* keep what we have */ }
    const { currency, ...location } = full;
    location.approximate = auto;
    setState(s => ({ ...s, location, ...(s.currencyAuto && currency ? { currency } : {}) }));
  }, []);

  useEffect(() => {
    if (!ready || !online || state.location) return;
    api('/geo/ip').then(r => applyLocation(r.location, { auto: true })).catch(() => {});
  }, [ready, online, state.location, applyLocation]);

  const lat = state.location?.lat, lon = state.location?.lon;
  useEffect(() => {
    if (lat == null || lon == null) return undefined;
    let off = false;
    const load = () => api(`/weather?lat=${lat}&lon=${lon}`).then(w => !off && setWeather(w)).catch(() => {});
    load();
    const id = setInterval(load, 15 * 60_000);
    return () => { off = true; clearInterval(id); };
  }, [lat, lon]);

  const syncLocation = useCallback(() => new Promise(resolve => {
    if (!navigator.geolocation) { toast('Your browser does not support location'); return resolve(false); }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        await applyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        toast('Location synced');
        resolve(true);
      },
      () => { toast('Location permission was denied'); resolve(false); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }), [applyLocation, toast]);

  // Live sync: follow the user when they move more than ~3 km
  useEffect(() => {
    if (!state.prefs.liveLocation || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      pos => {
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const cur = stateRef.current.location;
        if (!cur || haversineKm(cur, here) > 3) applyLocation(here);
      },
      () => { setState(s => ({ ...s, prefs: { ...s.prefs, liveLocation: false } })); toast('Live location stopped (permission denied)'); },
      { maximumAge: 60_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [state.prefs.liveLocation, applyLocation, toast]);

  // ── Actions ──
  const updateState = useCallback(patch => setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);
  const setCurrency = useCallback(code => {
    setState(s => ({ ...s, currency: code, currencyAuto: false }));
    toast(`Prices now shown in ${code}`);
  }, [toast]);
  const resetCurrencyAuto = useCallback(async () => {
    const loc = stateRef.current.location;
    try {
      const c = loc ? await api(`/geo/context?lat=${loc.lat}&lon=${loc.lon}`) : null;
      setState(s => ({ ...s, currencyAuto: true, ...(c?.currency ? { currency: c.currency } : {}) }));
      toast('Currency follows your location');
    } catch { toast('Could not detect your currency'); }
  }, [toast]);

  const savedIds = useMemo(() => new Set(state.saved.map(i => i.id)), [state.saved]);
  const toggleSaved = useCallback(item => {
    const exists = stateRef.current.saved.some(i => i.id === item.id);
    setState(s => ({ ...s, saved: exists ? s.saved.filter(i => i.id !== item.id) : [...s.saved, slimItem(item)] }));
    toast(exists ? `Removed ${item.name}` : `Saved ${item.name}`);
  }, [toast]);

  const adoptServerSession = useCallback(r => {
    setToken(r.token);
    setUser(r.user);
  }, []);
  const register = useCallback(async (email, password, name) => {
    adoptServerSession(await api('/auth/register', { method: 'POST', body: { email, password, name } }));
    toast('Account created. Your data is now yours on any device.');
  }, [adoptServerSession, toast]);
  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    adoptServerSession(r);
    skipNext.current = true; hydrated.current = true;
    setState(normalize(r.user.state));
    toast('Welcome back');
  }, [adoptServerSession, toast]);
  const logout = useCallback(() => {
    setToken('');
    try { localStorage.removeItem(LS); } catch { /* ignore */ }
    window.location.assign('/');
  }, []);
  const deleteAccount = useCallback(async () => { await api('/me', { method: 'DELETE' }); logout(); }, [logout]);

  const fmt = useCallback(usd => money(usd, state.currency, rates.rates), [state.currency, rates]);

  const value = useMemo(() => ({
    state, user, online, ready, rates, weather, saveStatus, fmt, savedIds,
    updateState, setCurrency, resetCurrencyAuto, toggleSaved, applyLocation, syncLocation,
    register, login, logout, deleteAccount, toast, toastState,
    chat, openChat: (seed = '') => setChat({ open: true, seed }), closeChat: () => setChat({ open: false, seed: '' }),
    product, openProduct: setProduct, currencyOpen, setCurrencyOpen,
  }), [state, user, online, ready, rates, weather, saveStatus, fmt, savedIds, updateState, setCurrency, resetCurrencyAuto,
    toggleSaved, applyLocation, syncLocation, register, login, logout, deleteAccount, toast, toastState, chat, product, currencyOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
