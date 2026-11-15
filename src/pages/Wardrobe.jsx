import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, MapPin, Plus, Shuffle, Sparkles, Trash2, Wind } from 'lucide-react';
import { useApp } from '../store.jsx';
import { useApiData } from '../lib/hooks.js';
import useTitle from '../lib/useTitle.js';
import { flag, matchScore } from '../lib/format.js';
import { Reveal } from '../components/motion.jsx';
import Img from '../components/Img.jsx';
import ProductCard from '../components/ProductCard.jsx';

const SLOTS = [
  { key: 'statement', label: 'Statement', cats: ['Outerwear', 'Tops', 'Dresses'] },
  { key: 'footwear', label: 'Footwear', cats: ['Shoes'] },
  { key: 'accent', label: 'Accent', cats: ['Bags', 'Watches', 'Jewellery', 'Eyewear'] },
];

// A transparent rule-based score: every point is explained, nothing is random.
export function scoreOutfit(items, dna) {
  const filled = items.filter(Boolean);
  const reasons = [];
  let score = 46;
  const add = (label, pts) => { score += pts; reasons.push({ label, pts }); };
  const cats = new Set(filled.map(i => i.category));
  const has = (...c) => c.some(x => cats.has(x));

  if (has('Outerwear', 'Tops', 'Dresses')) add('A clear statement piece anchors the look', 12); else add('No statement piece yet', -6);
  if (has('Shoes')) add('Footwear completes the outfit', 12); else add('Add footwear to finish', -6);
  if (has('Bags', 'Watches', 'Jewellery', 'Eyewear')) add('A considered accent', 8);
  const tiers = new Set(filled.map(i => i.tier));
  if (filled.length > 1 && tiers.size === 1) add(`Consistent ${[...tiers][0]} tier`, 10);
  else if (tiers.size > 2) add('Three price tiers pull against each other', -6);
  const genders = new Set(filled.map(i => i.gender).filter(g => g && g !== 'unisex'));
  if (genders.size > 1) add('Mixed menswear and womenswear cuts', -8);
  if (filled.length) {
    const avg = filled.reduce((s, i) => s + (i.rating || 4), 0) / filled.length;
    add(`Highly rated pieces (${avg.toFixed(1)}★ average)`, Math.round((avg - 3) * 5));
    const fit = filled.reduce((s, i) => s + matchScore(i, dna), 0) / filled.length;
    add(`Fits your Style DNA (${Math.round(fit)}% average)`, Math.round((fit - 75) / 3));
  }
  return { score: Math.max(35, Math.min(99, Math.round(score))), reasons };
}

function Ring({ value }) {
  const C = 2 * Math.PI * 44;
  return (
    <svg className="ring" viewBox="0 0 100 100" aria-label={`Coherence ${value}%`}>
      <circle cx="50" cy="50" r="44" className="ring-bg" />
      <motion.circle cx="50" cy="50" r="44" className="ring-fg" strokeDasharray={C} initial={{ strokeDashoffset: C }}
        animate={{ strokeDashoffset: C * (1 - value / 100) }} transition={{ duration: 1, ease: 'easeOut' }} />
      <text x="50" y="56" textAnchor="middle">{value}</text>
    </svg>
  );
}

export default function Wardrobe() {
  useTitle('My Wardrobe — Atelier');
  const { state, weather, fmt, updateState, openChat, toast } = useApp();
  const sample = useApiData('/catalogue?sort=rating&limit=60');
  const [idx, setIdx] = useState({ statement: 0, footwear: 0, accent: 0 });

  const pools = useMemo(() => {
    const catalogue = sample.data?.items || [];
    return Object.fromEntries(SLOTS.map(s => {
      const mine = state.saved.filter(i => s.cats.includes(i.category));
      const extra = catalogue.filter(i => s.cats.includes(i.category) && !mine.some(m => m.id === i.id));
      return [s.key, [...mine, ...extra]];
    }));
  }, [state.saved, sample.data]);

  const picks = SLOTS.map(s => pools[s.key].length ? pools[s.key][idx[s.key] % pools[s.key].length] : null);
  const { score, reasons } = useMemo(() => scoreOutfit(picks, state.dna), [picks, state.dna]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = state.saved.reduce((s, i) => s + i.priceUsd, 0);
  const loc = state.location;
  const step = (key, d) => setIdx(i => ({ ...i, [key]: (i[key] + d + 1000 * pools[key].length) % Math.max(1, pools[key].length) }));
  const shuffle = () => setIdx({ statement: Math.floor(Math.random() * 99), footwear: Math.floor(Math.random() * 99), accent: Math.floor(Math.random() * 99) });

  const saveLook = () => {
    const ids = picks.filter(Boolean).map(p => p.id);
    if (!ids.length) return;
    updateState(s => ({ outfits: [{ id: `o_${Date.now()}`, name: `Look ${s.outfits.length + 1}`, ids, coherence: score, createdAt: Date.now() }, ...s.outfits] }));
    toast('Look saved to your account');
  };
  const nameOf = id => [...state.saved, ...Object.values(pools).flat()].find(i => i.id === id)?.name || 'Piece';

  return (
    <>
      <header className="page-head">
        <Reveal>
          <div className="eyebrow">Your capsule</div>
          <h1 className="h1">Digital <em>wardrobe.</em></h1>
          <p className="lead">Everything here is saved to your account automatically and follows you to any device.</p>
        </Reveal>
      </header>

      <section className="dash">
        <Reveal className="dash-card dna-card">
          <small>Style DNA</small>
          <h3>{state.dna.archetype}</h3>
          <div className="swatches">{(state.dna.swatches || []).map(c => <i key={c} style={{ background: c }} title={c}></i>)}</div>
          <p>{state.dna.palette} · {state.dna.silhouette} · {state.dna.budgetTier}</p>
          <Link to="/quiz" className="link-arrow sm">{state.dna.completed ? 'Retake the quiz' : 'Take the quiz'}</Link>
        </Reveal>
        <Reveal className="dash-card" delay={0.08}>
          <small><MapPin size={12} /> {loc ? `${flag(loc.countryCode)} ${loc.city}` : 'Locating…'}</small>
          {weather ? (
            <>
              <h3>{weather.tempC}°C <span>{weather.summary}</span></h3>
              <p className="wx-meta"><Wind size={13} /> {weather.windKph} km/h · feels {weather.feelsC}° </p>
              <p>{weather.advice}</p>
              <div className="forecast">
                {weather.forecast.map(d => (
                  <div key={d.date}><b>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</b><span>{d.max}° / {d.min}°</span><em><Droplets size={11} />{d.rain}%</em></div>
                ))}
              </div>
            </>
          ) : <p>Fetching live weather for your location…</p>}
        </Reveal>
        <Reveal className="dash-card" delay={0.16}>
          <small>Capsule value</small>
          <h3>{fmt(total)}</h3>
          <p>{state.saved.length} saved piece{state.saved.length === 1 ? '' : 's'} · shown in {state.currency}</p>
          <Link to="/shop" className="link-arrow sm"><Plus size={14} /> Add more pieces</Link>
        </Reveal>
      </section>

      <section className="section tight">
        <Reveal className="section-head row"><h2 className="h2">Saved <em>rack.</em></h2></Reveal>
        {state.saved.length ? (
          <div className="grid">{state.saved.map((it, i) => <ProductCard key={it.id} item={{ ...it, images: [] }} index={i} />)}</div>
        ) : (
          <div className="empty"><h3>Your rack is empty.</h3><p>Tap the heart on any piece to save it here.</p><Link to="/shop" className="btn btn-solid">Explore the catalogue</Link></div>
        )}
      </section>

      <section className="section dark mixer">
        <Reveal className="section-head row">
          <div><div className="eyebrow gold">Coherence engine</div><h2 className="h2">Outfit <em>mixer.</em></h2></div>
          <button className="btn btn-ghost-light" onClick={shuffle}><Shuffle size={16} /> Surprise me</button>
        </Reveal>
        <div className="mixer-grid">
          {SLOTS.map((s, i) => {
            const p = picks[i];
            return (
              <div className="slot" key={s.key}>
                <small>{s.label}</small>
                <div className="slot-media">{p ? <Img key={p.id} src={p.image} name={p.name} /> : <span className="muted">Nothing available</span>}</div>
                <h4>{p ? p.name : '—'}</h4>
                <p>{p ? `${p.brand} · ${fmt(p.priceUsd)}` : ''}</p>
                <div className="slot-btns">
                  <button onClick={() => step(s.key, -1)} aria-label={`Previous ${s.label}`}>‹</button>
                  <button onClick={() => step(s.key, 1)} aria-label={`Next ${s.label}`}>›</button>
                </div>
              </div>
            );
          })}
          <div className="score-card">
            <Ring value={score} />
            <h4>Coherence</h4>
            <ul>{reasons.map(r => <li key={r.label} className={r.pts >= 0 ? 'good' : 'bad'}><b>{r.pts >= 0 ? '+' : ''}{r.pts}</b> {r.label}</li>)}</ul>
          </div>
        </div>
        <div className="mixer-actions">
          <button className="btn btn-gold" onClick={saveLook}>Save this look</button>
          <button className="btn btn-ghost-light" onClick={() => openChat(`Style this look for me: ${picks.filter(Boolean).map(p => `${p.brand} ${p.name}`).join(', ')}`)}>
            <Sparkles size={16} /> Ask the stylist
          </button>
        </div>

        {state.outfits.length > 0 && (
          <div className="looks">
            <h3>Saved looks</h3>
            {state.outfits.map(o => (
              <div className="look" key={o.id}>
                <b>{o.name}</b><span>{o.ids.map(nameOf).join(' · ')}</span><em>{o.coherence}%</em>
                <button className="icon-btn light" onClick={() => updateState(s => ({ outfits: s.outfits.filter(x => x.id !== o.id) }))} aria-label="Delete look"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
