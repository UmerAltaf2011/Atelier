import { Suspense, lazy, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../store.jsx';
import { useApiData } from '../lib/hooks.js';
import useTitle from '../lib/useTitle.js';
import { flag } from '../lib/format.js';
import { CountUp, Magnetic, Marquee, Reveal } from '../components/motion.jsx';
import { PinnedRow, ScrollWords, Shout, Tape } from '../components/street.jsx';
import Img, { BrandLogo } from '../components/Img.jsx';
import ProductCard from '../components/ProductCard.jsx';
import CharacterPicker from '../components/CharacterPicker.jsx';
const Mannequin3D = lazy(() => import('../components/Mannequin3D.jsx'));

const FX_CODES = ['EUR', 'GBP', 'JPY', 'AED', 'PKR', 'INR', 'CAD', 'AUD', 'CHF', 'SAR', 'CNY', 'SGD', 'TRY', 'KRW', 'MXN', 'BRL', 'ZAR', 'THB'];
const STEPS = [
  ['01', 'Pick your lane', 'A six-question fit check that changes every time. Streetwear, starboy, gorpcore, desi festive, grunge and more. Your result saves itself.'],
  ['02', 'Shop Pakistan and the world', 'Local labels next to global brands. Filter by lane, priced in your currency, matched to your weather.'],
  ['03', 'Build, mix, ask', 'Save pieces to your rack, mix looks with a coherence score, and ask the AI stylist what to wear today.'],
];
const MANIFESTO = "Streetwear isn't a price tag. It's how you move through your _block._ We put Pakistani labels and global brands side by side, match them to your weather, your budget and your currency, and let an AI stylist call your _fit._";

function HeroColumn({ photos, reverse, speed }) {
  if (!photos.length) return <div className="hero-col"><div className="skeleton tall"></div><div className="skeleton"></div><div className="skeleton tall"></div></div>;
  return (
    <div className="hero-col">
      <div className="hero-col-track" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        {[...photos, ...photos].map((p, i) => <Img key={i} className="hero-photo" src={p.src} name={p.alt} />)}
      </div>
    </div>
  );
}

export default function Home() {
  useTitle('Atelier — Wear your block');
  const { state, weather, rates } = useApp();
  const editorial = useApiData('/editorial');
  const trending = useApiData('/catalogue?sort=rating&limit=14');
  const brandsData = useApiData('/brands');
  const stats = useApiData('/stats');
  const archData = useApiData('/archetypes');
  const archetypes = archData.data?.archetypes || [];
  const [vibeId, setVibeId] = useState('');
  const [char, setChar] = useState('style');
  const vibe = archetypes.find(a => a.id === (vibeId || state.dna.archetypeId)) || archetypes[0];
  const rail = useRef(null), stepsRef = useRef(null), heroRef = useRef(null);

  const { scrollYProgress: stepsProgress } = useScroll({ target: stepsRef, offset: ['start 75%', 'end 65%'] });
  // The hero is 250svh tall with a sticky stage: scroll scrubs the whole scene.
  const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ['start start', 'end end'] });
  const l1 = useTransform(hp, [0, 1], ['0%', '-55%']);
  const l2 = useTransform(hp, [0, 1], ['0%', '40%']);
  const l3 = useTransform(hp, [0, 1], ['0%', '-30%']);
  const bgScale = useTransform(hp, [0, 1], [1, 1.25]);
  const bgFilter = useTransform(hp, [0, 0.7], ['grayscale(1) contrast(1.2)', 'grayscale(0) contrast(1)']);
  const copyOp = useTransform(hp, [0, 0.35], [1, 0]);
  const copyY = useTransform(hp, [0, 0.35], [0, -60]);
  const stampS = useTransform(hp, [0.45, 0.8], [0, 1]);
  const stampR = useTransform(hp, [0.45, 0.8], [-40, -8]);

  const photos = editorial.data?.photos || [];
  const cols = useMemo(() => [0, 1, 2].map(c => photos.filter((_, i) => i % 3 === c).slice(0, 8)), [photos]);
  const brands = brandsData.data?.brands || [];
  const lux = brands.filter(b => b.tier === 'Luxury');
  const rest = brands.filter(b => b.tier !== 'Luxury');
  const fxCodes = FX_CODES.filter(c => rates.rates[c]);
  const loc = state.location;
  const cur = state.currency !== 'USD' && rates.rates[state.currency] ? state.currency : 'EUR';
  const scrollRail = dir => rail.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });

  return (
    <>
      <section className="st-hero" ref={heroRef}>
        <div className="st-stage">
          <motion.div className="st-bg" style={{ scale: bgScale, filter: bgFilter }}>
            <HeroColumn photos={cols[0]} speed={70} />
            <HeroColumn photos={cols[1]} speed={90} reverse />
            <HeroColumn photos={cols[2]} speed={75} />
          </motion.div>
          <div className="st-shade"></div>

          <div className="st-words" aria-label="Wear your block.">
            <motion.span className="st-w w1" style={{ x: l1 }}>WEAR</motion.span>
            <motion.span className="st-w w2" style={{ x: l2 }}>YOUR</motion.span>
            <motion.span className="st-w w3" style={{ x: l3 }}>BLOCK<i>.</i></motion.span>
          </div>

          <motion.div className="st-copy" style={{ opacity: copyOp, y: copyY }}>
            <div className="st-chips">
              <span><i className="live-dot"></i>{stats.data ? `${stats.data.brands}+ brands · ${stats.data.products.toLocaleString()} pieces` : 'Live catalogue'}</span>
              <span><MapPin size={14} /> {loc ? `${flag(loc.countryCode)} ${loc.city}` : 'Locating you…'}</span>
              {weather && <span>{weather.tempC}°C · {weather.summary}</span>}
              <span>1 USD = {rates.rates[cur] >= 100 ? Math.round(rates.rates[cur]).toLocaleString() : Number(rates.rates[cur] || 1).toFixed(2)} {cur}</span>
            </div>
            <p className="st-sub">Streetwear from Pakistan and the world, styled by an AI that never asks the same question twice.</p>
            <div className="st-cta">
              <Magnetic><Link to="/quiz" className="btn btn-gold">Take the fit check <ArrowRight size={17} /></Link></Magnetic>
              <Magnetic><Link to="/shop" className="btn btn-ghost-light">See the drop</Link></Magnetic>
            </div>
            <div className="st-scroll">scroll<i></i></div>
          </motion.div>

          <motion.div className="st-stamp" style={{ scale: stampS, rotate: stampR }}>
            <b>NO LUXURY TAX</b><span>keep scrolling</span>
          </motion.div>

          {[['s1', '🧢'], ['s2', '🛹'], ['s3', '⭐'], ['s4', '👟']].map(([c, e], i) => (
            <motion.div key={c} className={`sticker ${c}`} drag dragSnapToOrigin dragElastic={0.5} aria-hidden="true"
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: [0, i % 2 ? 8 : -8, 0] }}
              transition={{ scale: { delay: 1.8 + i * 0.12, type: 'spring' }, rotate: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut' } }}
              whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9, cursor: 'grabbing' }}>{e}</motion.div>
          ))}
        </div>
      </section>

      <Tape className="hazard" tilt={-1.5}>{['LOCAL LABELS', 'GLOBAL FITS', 'YOUR CURRENCY', 'YOUR WEATHER'].map(t => <span key={t}><b>{t}</b><i>✦</i></span>)}</Tape>
      <div className="fx-band">
        <Marquee speed={60}>
          {fxCodes.map(c => <span className="fx-item" key={c}><b>USD/{c}</b> {rates.rates[c] >= 100 ? Math.round(rates.rates[c]).toLocaleString() : Number(rates.rates[c]).toFixed(3)}</span>)}
        </Marquee>
      </div>

      <section className="section manifesto"><ScrollWords text={MANIFESTO} /></section>

      {archetypes.length > 0 && (
        <PinnedRow className="lanes">
          <div className="lane-intro"><h2 className="h2">Pick your <em>lane.</em></h2><p>{archetypes.length} styles. Keep scrolling, it moves sideways.</p></div>
          {archetypes.map((a, i) => (
            <Link to={`/shop?style=${a.id}`} className="lane" key={a.id} style={{ '--c': a.swatches[0], '--c2': a.swatches[1] || a.swatches[0], rotate: `${i % 2 ? 2 : -2}deg` }}>
              <span className="lane-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="lane-e">{a.emoji}</span>
              <h3>{a.name}</h3>
              <p>{a.tagline}</p>
              <span className="lane-go">Shop it <ArrowRight size={16} /></span>
            </Link>
          ))}
          <div className="lane-end"><Link to="/quiz" className="btn btn-gold big">Not sure? Take the fit check</Link></div>
        </PinnedRow>
      )}

      <section className="section dark" id="vibes">
        <Reveal className="section-head">
          <div className="eyebrow gold">Vibe studio</div>
          <h2 className="h2">Try every lane on a <em>3D you.</em></h2>
        </Reveal>
        {vibe && (
          <div className="studio">
            <div className="studio-stage" style={{ '--stage': vibe.swatches[0] }}>
              <Suspense fallback={<div className="mannequin" style={{ height: 480 }} />}>
                <Mannequin3D archetype={vibe} character={char} height={480} />
              </Suspense>
              <div className="studio-hint">drag to spin</div>
            </div>
            <div className="studio-copy">
              <AnimatePresence mode="wait">
                <motion.div key={vibe.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
                  <div className="eyebrow gold">{vibe.emoji} {vibe.palette}</div>
                  <h3>{vibe.name}</h3>
                  <p>{vibe.tagline} {vibe.silhouette}.</p>
                  <div className="swatches big" style={{ marginTop: 16 }}>{vibe.swatches.map(c => <i key={c} style={{ background: c }} />)}</div>
                </motion.div>
              </AnimatePresence>
              <div className="eyebrow gold" style={{ marginTop: 22 }}>Or dress up as an anime hero</div>
              <CharacterPicker value={char} onChange={setChar} />
              <div className="vibe-grid">
                {archetypes.map(a => (
                  <motion.button key={a.id} className={`vibe${a.id === vibe.id ? ' on' : ''}`} onClick={() => setVibeId(a.id)} whileHover={{ y: -3, rotate: -2 }} whileTap={{ scale: 0.92 }}>
                    <span className="e">{a.emoji}</span>{a.name}
                  </motion.button>
                ))}
              </div>
              <Magnetic><Link to={`/shop?style=${vibe.id}`} className="btn btn-gold">Shop {vibe.name} <ArrowRight size={17} /></Link></Magnetic>
            </div>
          </div>
        )}
      </section>

      <section className="section" ref={stepsRef}>
        <Reveal className="section-head">
          <div className="eyebrow">How it works</div>
          <h2 className="h2">Three moves to a rack that <em>gets you.</em></h2>
        </Reveal>
        <div className="steps">
          <div className="steps-line"><motion.span style={{ scaleY: stepsProgress }}></motion.span></div>
          {STEPS.map(([n, title, body], i) => (
            <Reveal key={n} className="step" delay={i * 0.08}>
              <span className="step-n">{n}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section dark">
        <Reveal className="section-head row">
          <div>
            <div className="eyebrow gold">Trending live</div>
            <h2 className="h2">Top-rated pieces <em>right now.</em></h2>
          </div>
          <div className="rail-btns">
            <button className="icon-btn light" onClick={() => scrollRail(-1)} aria-label="Scroll left"><ChevronLeft size={20} /></button>
            <button className="icon-btn light" onClick={() => scrollRail(1)} aria-label="Scroll right"><ChevronRight size={20} /></button>
          </div>
        </Reveal>
        <div className="rail" ref={rail}>
          {trending.loading && [0, 1, 2, 3].map(i => <div className="rail-item" key={i}><div className="skeleton card"></div></div>)}
          {(trending.data?.items || []).map((it, i) => <div className="rail-item" key={it.id}><ProductCard item={it} index={i} /></div>)}
        </div>
        <Link to="/shop" className="link-arrow">Browse the full catalogue <ArrowRight size={16} /></Link>
      </section>

      <section className="section brands-sec">
        <Reveal className="section-head center">
          <div className="eyebrow">Worldwide</div>
          <h2 className="h2">Every label. <em>One rack.</em></h2>
        </Reveal>
        <Marquee speed={70} className="logos">{lux.map(b => <Link to="/brands" className="logo-chip" key={b.name}><BrandLogo brand={b} size={34} />{b.name}</Link>)}</Marquee>
        <Marquee speed={85} reverse className="logos">{rest.slice(0, 60).map(b => <Link to="/brands" className="logo-chip" key={b.name}><BrandLogo brand={b} size={34} />{b.name}</Link>)}</Marquee>
      </section>

      <section className="section stats">
        {[
          [stats.data?.brands, '+', 'Brands in the directory'],
          [stats.data?.products, '', 'Pieces in the catalogue'],
          [stats.data?.currencies, '', 'Currencies supported'],
          [stats.data?.countries, '', 'Countries represented'],
          [brands.filter(b => b.country === 'PK').length || null, '', 'Pakistani brands'],
        ].map(([n, suffix, label]) => (
          <Reveal key={label} className="stat"><b>{n ? <CountUp to={n} suffix={suffix} /> : '—'}</b><span>{label}</span></Reveal>
        ))}
      </section>

      <section className="section stylist-sec">
        <Reveal className="stylist-copy">
          <div className="eyebrow gold">AI stylist</div>
          <h2 className="h2">Ask. It already <em>knows you.</em></h2>
          <p>Your Style DNA, your saved pieces, today's forecast and your currency are in every answer, and every conversation is saved to your account.</p>
          <Link to="/quiz" className="btn btn-gold">Meet your stylist <ArrowRight size={17} /></Link>
        </Reveal>
        <div className="chat-demo">
          {[['u', 'What do I wear to a wedding this weekend?'], ['a', 'Go tonal and sharp: one statement piece, clean sneakers or loafers, quiet accessories. It will be 16°C in the evening, bring a light layer.'], ['u', 'Keep it under 300.']].map(([who, text], i) => (
            <motion.div key={i} className={`demo-msg ${who}`} initial={{ opacity: 0, y: 18, rotate: who === 'u' ? 2 : -2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-60px' }} transition={{ delay: 0.25 + i * 0.5, type: 'spring', stiffness: 140, damping: 14 }}>{text}</motion.div>
          ))}
        </div>
      </section>

      <Shout to={{ href: '/quiz', label: 'Take the fit check' }}>STEP<br />OUT<i>.</i></Shout>
    </>
  );
}
