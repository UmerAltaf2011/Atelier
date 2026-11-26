import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useDebounced } from '../lib/hooks.js';
import { PageHero } from '../components/street.jsx';
import useTitle from '../lib/useTitle.js';
import { useApp } from '../store.jsx';
import { Reveal } from '../components/motion.jsx';
import ProductCard from '../components/ProductCard.jsx';

const SORTS = [['rating', 'Top rated'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']];

export default function Shop() {
  useTitle('Discover — Atelier');
  const { fmt, state } = useApp();
  const [sp, setSp] = useSearchParams();
  const f = {
    q: sp.get('q') || '', category: sp.get('category') || 'All', gender: sp.get('gender') || 'All',
    tier: sp.get('tier') || 'All', brand: sp.get('brand') || '', style: sp.get('style') || '', sort: sp.get('sort') || 'rating', maxUsd: sp.get('maxUsd') || '',
  };
  const set = patch => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'All' || (k === 'sort' && v === 'rating')) n.delete(k); else n.set(k, v);
    }
    setSp(n, { replace: true });
  };

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1, live: true });
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moreBusy, setMoreBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const [qInput, setQInput] = useState(f.q);
  const dq = useDebounced(qInput, 350);
  useEffect(() => { if (dq !== f.q) set({ q: dq }); }, [dq]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxPrice = facets?.maxPriceUsd || 1000;
  const [price, setPrice] = useState(f.maxUsd || '');
  const dPrice = useDebounced(price, 400);
  useEffect(() => {
    const v = Number(dPrice);
    const next = v && v < maxPrice ? String(v) : '';
    if (next !== f.maxUsd) set({ maxUsd: next });
  }, [dPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && v !== 'All' && p.set(k, v));
    return p.toString();
  }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let off = false;
    setLoading(true);
    setFailed(false);
    api(`/catalogue?${key}&limit=24&page=1`)
      .then(r => {
        if (off) return;
        setItems(r.items);
        setMeta({ total: r.total, pages: r.pages, page: 1, live: r.live });
        setFacets(prev => prev || r.facets);
      })
      .catch(() => !off && setFailed(true))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [key]);

  const loadMore = async () => {
    const next = meta.page + 1;
    setMoreBusy(true);
    try {
      const r = await api(`/catalogue?${key}&limit=24&page=${next}`);
      setItems(i => [...i, ...r.items]);
      setMeta(m => ({ ...m, page: next }));
    } catch { /* keep what we have */ } finally { setMoreBusy(false); }
  };

  const clear = () => { setQInput(''); setPrice(''); setSp({}, { replace: true }); };
  const filtered = !!(f.q || f.brand || f.style || f.maxUsd || f.category !== 'All' || f.gender !== 'All' || f.tier !== 'All' || f.sort !== 'rating');
  const sliderValue = Number(price) || maxPrice;

  return (
    <>
      <PageHero variant="drop" kicker="Live catalogue" lines={[['THE', ''], ['DROP.', 'tag']]}
        sub={<p className="lead">
            {meta.total.toLocaleString()} pieces from live feeds and our curated Pakistan + world catalogue, priced in {state.currency}.
            {!meta.live && ' (Offline sample shown: the live feeds are unreachable right now.)'}
          </p>} />

      <div className="filters">
        <label className="search-field wide">
          <Search size={17} />
          <input value={qInput} onChange={e => setQInput(e.target.value)} placeholder="Search pieces, brands, fabrics…" />
          {qInput && <button type="button" onClick={() => setQInput('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <div className="style-row" role="group" aria-label="Style archetype">
          <button className={`chip${!f.style ? ' on' : ''}`} onClick={() => set({ style: '' })}>✨ All vibes</button>
          {(facets?.styles || []).filter(x => x.n > 0).map(x => (
            <button key={x.id} className={`chip${f.style === x.id ? ' on' : ''}`} onClick={() => set({ style: x.id })}>{x.emoji} {x.name}</button>
          ))}
        </div>
        <div className="chip-row">
          {['All', ...(facets?.categories || []).map(c => c.name)].map(c => (
            <button key={c} className={`chip${f.category === c ? ' on' : ''}`} onClick={() => set({ category: c })}>{c}</button>
          ))}
        </div>
        <div className="select-row">
          <select value={f.gender} onChange={e => set({ gender: e.target.value })} aria-label="Gender">
            <option value="All">All styles</option><option value="women">Women</option><option value="men">Men</option>
          </select>
          <select value={f.tier} onChange={e => set({ tier: e.target.value })} aria-label="Brand tier">
            <option value="All">All tiers</option>
            {(facets?.tiers || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <select value={f.brand} onChange={e => set({ brand: e.target.value })} aria-label="Brand">
            <option value="">All brands</option>
            {(facets?.brands || []).map(b => <option key={b.name} value={b.name}>{b.name} ({b.n})</option>)}
          </select>
          <select value={f.sort} onChange={e => set({ sort: e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="range">
            <span>Up to <b>{fmt(sliderValue)}</b></span>
            <input type="range" min="10" max={maxPrice} step="5" value={sliderValue} onChange={e => setPrice(e.target.value)} />
          </label>
          {filtered && <button className="btn btn-line btn-sm" onClick={clear}><X size={14} /> Clear</button>}
        </div>
      </div>

      <section className="grid-wrap">
        {loading ? (
          <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton card"></div>)}</div>
        ) : failed ? (
          <div className="empty"><h3>We couldn't reach the catalogue.</h3><p>Check that the server is running, then retry.</p><button className="btn btn-solid" onClick={() => setSp(new URLSearchParams(sp))}>Retry</button></div>
        ) : !items.length ? (
          <div className="empty"><h3>No pieces match.</h3><p>Try a different search or clear the filters.</p><button className="btn btn-solid" onClick={clear}>Clear filters</button></div>
        ) : (
          <>
            <div className="grid">
              <AnimatePresence>
                {items.map((it, i) => <ProductCard key={it.id} item={it} index={i} />)}
              </AnimatePresence>
            </div>
            {meta.page < meta.pages && (
              <div className="more"><button className="btn btn-line" onClick={loadMore} disabled={moreBusy}>{moreBusy ? 'Loading…' : `Show more (${(meta.total - items.length).toLocaleString()} left)`}</button></div>
            )}
          </>
        )}
      </section>
    </>
  );
}
