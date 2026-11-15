import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../store.jsx';
import { useApiData } from '../lib/hooks.js';
import useTitle from '../lib/useTitle.js';
import { flag } from '../lib/format.js';
import { CountUp, Magnetic, Marquee, Reveal, SplitText } from '../components/motion.jsx';
import Img, { BrandLogo } from '../components/Img.jsx';
import ProductCard from '../components/ProductCard.jsx';

const FX_CODES = ['EUR', 'GBP', 'JPY', 'AED', 'PKR', 'INR', 'CAD', 'AUD', 'CHF', 'SAR', 'CNY', 'SGD', 'TRY', 'KRW', 'MXN', 'BRL', 'ZAR', 'THB'];

const STEPS = [
  ['01', 'Know your style', 'A four-question diagnostic builds your Style DNA: silhouette, palette, occasion and budget tier. It follows you everywhere.'],
  ['02', 'Shop the whole world', 'Live pieces from many feeds, priced in your currency and ranked by how well they fit your DNA and your weather.'],
  ['03', 'Build, mix, ask', 'Save pieces to your wardrobe, mix looks with a transparent coherence score, and ask the AI stylist what to wear today.'],
];

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
  useTitle('Atelier — Dress with intelligence');
  const { state, weather, rates } = useApp();
  const editorial = useApiData('/editorial');
  const trending = useApiData('/catalogue?sort=rating&limit=14');
  const brandsData = useApiData('/brands');
  const stats = useApiData('/stats');
  const rail = useRef(null);
  const stepsRef = useRef(null);
  const heroRef = useRef(null);

  const { scrollYProgress: stepsProgress } = useScroll({ target: stepsRef, offset: ['start 75%', 'end 65%'] });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroProgress, [0, 1], ['0%', '18%']);
  const heroFade = useTransform(heroProgress, [0, 0.8], [1, 0]);

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
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-bg" style={{ y: heroY }}>
          <HeroColumn photos={cols[0]} speed={70} />
          <HeroColumn photos={cols[1]} speed={90} reverse />
          <HeroColumn photos={cols[2]} speed={75} />
        </motion.div>
        <div className="hero-shade"></div>
        <div className="hero-glow"></div>

        <motion.div className="hero-inner" style={{ opacity: heroFade }}>
          <motion.div className="hero-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <i className="live-dot"></i>
            {stats.data ? `${stats.data.brands}+ brands · ${stats.data.products.toLocaleString()} live pieces · ${stats.data.currencies} currencies` : 'The intelligent wardrobe'}
          </motion.div>
          <h1 className="hero-title">
            <SplitText text="Dress with" delay={0.3} /><br />
            <SplitText text="_intelligence._" delay={0.55} />
          </h1>
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            Live brand data from around the world, priced in your currency, styled for your weather, and guided by an AI stylist that remembers you.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}>
            <Magnetic><Link to="/quiz" className="btn btn-gold">Find my style DNA <ArrowRight size={17} /></Link></Magnetic>
            <Magnetic><Link to="/shop" className="btn btn-ghost-light">Explore live catalogue</Link></Magnetic>
          </motion.div>

          <motion.div className="hero-chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <span><MapPin size={14} /> {loc ? `${flag(loc.countryCode)} ${loc.city}` : 'Locating you…'}</span>
            {weather && <span>{weather.tempC}°C · {weather.summary}</span>}
            <span>1 USD = {rates.rates[cur] >= 100 ? Math.round(rates.rates[cur]).toLocaleString() : Number(rates.rates[cur] || 1).toFixed(2)} {cur}</span>
          </motion.div>
        </motion.div>

        <motion.div className="hero-float f1" animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <small>Style match</small><b>97%</b><span>Suede field jacket</span>
        </motion.div>
        <motion.div className="hero-float f2" animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
          <Sparkles size={15} /> <span>“Wear layers today, rain after 4pm.”</span>
        </motion.div>
      </section>

      <div className="fx-band">
        <Marquee speed={60}>
          {fxCodes.map(c => (
            <span className="fx-item" key={c}><b>USD/{c}</b> {rates.rates[c] >= 100 ? Math.round(rates.rates[c]).toLocaleString() : Number(rates.rates[c]).toFixed(3)}</span>
          ))}
        </Marquee>
      </div>

      <section className="section" ref={stepsRef}>
        <Reveal className="section-head">
          <div className="eyebrow">How it works</div>
          <h2 className="h2">Three steps to a wardrobe that <em>thinks.</em></h2>
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
          <h2 className="h2">Every house. <em>One wardrobe.</em></h2>
        </Reveal>
        <Marquee speed={70} className="logos">
          {lux.map(b => <Link to="/brands" className="logo-chip" key={b.name}><BrandLogo brand={b} size={34} />{b.name}</Link>)}
        </Marquee>
        <Marquee speed={85} reverse className="logos">
          {rest.slice(0, 60).map(b => <Link to="/brands" className="logo-chip" key={b.name}><BrandLogo brand={b} size={34} />{b.name}</Link>)}
        </Marquee>
      </section>

      <section className="section stats">
        {[
          [stats.data?.brands, '+', 'Brands in the directory'],
          [stats.data?.products, '', 'Live pieces in the catalogue'],
          [stats.data?.currencies, '', 'Currencies supported'],
          [stats.data?.countries, '', 'Countries represented'],
        ].map(([n, suffix, label]) => (
          <Reveal key={label} className="stat">
            <b>{n ? <CountUp to={n} suffix={suffix} /> : '—'}</b>
            <span>{label}</span>
          </Reveal>
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
          {[
            ['u', 'What should I wear to a wedding this weekend?'],
            ['a', 'Go tonal and tailored: one statement piece, quiet accessories, polished shoes. It will be 16°C in the evening, so bring a light layer.'],
            ['u', 'Keep it under 300.'],
          ].map(([who, text], i) => (
            <motion.div key={i} className={`demo-msg ${who}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }} transition={{ delay: 0.25 + i * 0.5, duration: 0.6 }}>{text}</motion.div>
          ))}
        </div>
      </section>

      <section className="cta-big">
        <Reveal>
          <h2 className="cta-title">Your wardrobe has been<br />waiting for <em>this.</em></h2>
          <Magnetic><Link to="/quiz" className="btn btn-gold big">Start free <ArrowRight size={18} /></Link></Magnetic>
          <p className="muted">No card. No setup. Everything you do is saved automatically.</p>
        </Reveal>
      </section>
    </>
  );
}
