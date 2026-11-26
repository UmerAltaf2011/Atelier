import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { useApiData } from '../lib/hooks.js';
import { PageHero } from '../components/street.jsx';
import useTitle from '../lib/useTitle.js';
import { flag } from '../lib/format.js';
import { Reveal } from '../components/motion.jsx';
import { BrandLogo } from '../components/Img.jsx';

export default function Brands() {
  useTitle('Brands — Atelier');
  const { data, loading } = useApiData('/brands');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('All');
  const [country, setCountry] = useState('All');

  const brands = data?.brands || [];
  const tiers = useMemo(() => ['All', ...new Set(brands.map(b => b.tier))], [brands]);
  const countries = useMemo(() => ['All', ...[...new Set(brands.map(b => b.country))].sort()], [brands]);
  const list = brands.filter(b =>
    (tier === 'All' || b.tier === tier) && (country === 'All' || b.country === country) &&
    (!q || b.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <PageHero variant="wall" kicker="Worldwide directory" lines={[['THE', ''], ['WALL.', 'tag']]}
        sub={<p className="lead">{brands.length || '…'} brands from {countries.length - 1 || '…'} countries. Logos load live from each brand's own site. Tap a label to see its full range.</p>} />

      <div className="filters">
        <label className="search-field wide"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a brand…" /></label>
        <div className="chip-row">
          {tiers.map(t => <button key={t} className={`chip${tier === t ? ' on' : ''}`} onClick={() => setTier(t)}>{t}</button>)}
        </div>
        <div className="select-row">
          <select value={country} onChange={e => setCountry(e.target.value)} aria-label="Country">
            {countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All countries' : `${flag(c)} ${c}`}</option>)}
          </select>
        </div>
      </div>

      <section className="grid-wrap">
        <div className="brand-grid">
          {loading && Array.from({ length: 12 }, (_, i) => <div key={i} className="skeleton brand-skel"></div>)}
          {list.map((b, i) => (
            <Reveal key={b.name} className="brand-tile" delay={(i % 6) * 0.04} y={22}>
              <BrandLogo brand={b} size={56} />
              <h3>{b.name}</h3>
              <p>{flag(b.country)} {b.country} · {b.tier}</p>
              <div className="brand-links">
                {b.products > 0 && <Link to={`/shop?brand=${encodeURIComponent(b.name)}`} className="tag-live"><i></i>{b.products} piece{b.products > 1 ? 's' : ''}</Link>}
                <a href={`https://${b.domain}`} target="_blank" rel="noreferrer noopener">Official site <ArrowUpRight size={13} /></a>
              </div>
            </Reveal>
          ))}
        </div>
        {!loading && !list.length && <div className="empty"><h3>No brands match.</h3></div>}
      </section>
    </>
  );
}
