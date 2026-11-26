import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { Link } from 'react-router-dom';

const wrap = (min, max, v) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };
const EASE = [0.2, 0.7, 0.2, 1];

/* Tape: a tilted marquee whose speed (and direction) follows how hard you scroll. */
export function Tape({ children, base = -0.7, tilt = -2, className = '' }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const smooth = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * base * (delta / 16);
    if (boost.get() < 0) dir.current = -1; else if (boost.get() > 0) dir.current = 1;
    move += dir.current * move * boost.get();
    baseX.set(baseX.get() + move);
  });
  const x = useTransform(baseX, v => `${wrap(-50, 0, v)}%`);
  return (
    <div className={`tape ${className}`} style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <motion.div className="tape-track" style={{ x }}>
        {[0, 1, 2, 3].map(i => <span className="tape-set" key={i}>{children}</span>)}
      </motion.div>
    </div>
  );
}

/* ScrollWords: words light up one by one as you scroll through the paragraph. _word_ gets a marker highlight. */
function Word({ w, hl, p, a, b }) {
  const o = useTransform(p, [a, b], [0.14, 1]);
  return <motion.span className={hl ? 'sw hl' : 'sw'} style={{ opacity: o }}>{w}{' '}</motion.span>;
}
export function ScrollWords({ text, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={`scroll-words ${className}`} aria-label={text.replace(/_/g, '')}>
      {words.map((raw, i) => {
        const hl = raw.startsWith('_') && raw.endsWith('_');
        return <Word key={i} w={hl ? raw.slice(1, -1) : raw} hl={hl} p={p} a={i / words.length} b={Math.min(1, (i + 2) / words.length)} />;
      })}
    </p>
  );
}

/* Pinned horizontal scroll: vertical scrolling drives the track sideways. */
export function PinnedRow({ children, className = '' }) {
  const outer = useRef(null), track = useRef(null);
  const [dist, setDist] = useState(0);
  useLayoutEffect(() => {
    const measure = () => { if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth)); };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [children]);
  const { scrollYProgress: p } = useScroll({ target: outer, offset: ['start start', 'end end'] });
  const x = useTransform(p, [0, 1], [0, -dist]);
  const bar = useTransform(p, [0, 1], ['0%', '100%']);
  return (
    <div ref={outer} className={`pinned ${className}`} style={{ height: `calc(100svh + ${dist}px)` }}>
      <div className="pinned-stick">
        <motion.div ref={track} className="pinned-track" style={{ x }}>{children}</motion.div>
        <div className="pinned-meter" aria-hidden="true"><motion.i style={{ width: bar }} /></div>
      </div>
    </div>
  );
}

function Letters({ text, delay = 0 }) {
  return (
    <span className="ph-line" aria-label={text}>
      {[...text].map((c, i) => (
        <span className="ph-ch" aria-hidden="true" key={i}>
          <motion.span initial={{ y: '120%', rotate: 8 }} animate={{ y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 15, delay: delay + i * 0.045 }}>{c === ' ' ? '\u00a0' : c}</motion.span>
        </span>
      ))}
    </span>
  );
}

/* PageHero: every page gets its own opening scene. variant: drop | wall | rack | manual | id */
const WALL = [['LOCAL', '6%', '18%', -8, 0], ['GLOBAL', '70%', '12%', 6, 1], ['ARCHIVE', '82%', '58%', -4, 2], ['DESI', '14%', '66%', 9, 1], ['NEW', '46%', '74%', -6, 0]];
const RACK = ['🧥', '👕', '👖', '🧢', '👟', '👜', '🧣', '🧥', '👕', '👖', '🧢', '👟'];
export function PageHero({ variant, kicker, lines, sub, children, card }) {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(p, [0, 1], [0, 140]);
  const fade = useTransform(p, [0, 0.85], [1, 0]);
  const scale = useTransform(p, [0, 1], [1, variant === 'drop' ? 0.7 : 0.88]);
  const skew = useTransform(p, [0, 1], [0, variant === 'drop' ? -10 : 0]);
  const railX = useTransform(p, [0, 1], [0, -420]);
  const m1 = useTransform(p, [0, 1], [0, -110]), m2 = useTransform(p, [0, 1], [0, 70]), m3 = useTransform(p, [0, 1], [0, -200]);
  const mv = [m1, m2, m3];
  const cardRot = useTransform(p, [0, 1], [-7, 12]);
  const cardY = useTransform(p, [0, 1], [0, 90]);
  let d = 0.1;
  return (
    <header ref={ref} className={`ph ph-${variant}`}>
      {variant === 'drop' && <Tape className="hazard" base={-0.9} tilt={-2.2}>{['NEW DROP', 'FRESH PIECES', 'PAKISTAN × WORLD', 'YOUR CURRENCY'].map(t => <Fragment key={t}><b>{t}</b><i>✦</i></Fragment>)}</Tape>}
      {variant === 'wall' && WALL.map(([t, l, tp, r, k], i) => (
        <motion.span key={t} className="wall-tag" style={{ left: l, top: tp, rotate: r, y: mv[k] }} drag dragSnapToOrigin dragElastic={0.4}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.6 + i * 0.1 }}>{t}</motion.span>
      ))}
      {variant === 'rack' && (
        <div className="rack" aria-hidden="true">
          <i className="rod"></i>
          <motion.div className="hangers" style={{ x: railX }}>
            {RACK.map((e, i) => <span key={i} className="hanger" style={{ animationDelay: `${(i % 5) * -0.7}s` }}><u></u>{e}</span>)}
          </motion.div>
        </div>
      )}
      <motion.div className="ph-inner" style={{ y, opacity: fade }}>
        <div className="ph-kicker">{kicker}</div>
        <motion.h1 className="ph-title" style={{ scale, skewX: skew }}>
          {lines.map(([t, cls]) => { const el = <span key={t} className={`ph-row ${cls || ''}`}><Letters text={t} delay={d} /></span>; d += t.length * 0.045; return el; })}
        </motion.h1>
        {sub && <motion.div className="ph-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, ease: EASE }}>{sub}</motion.div>}
        {children}
      </motion.div>
      {variant === 'id' && (
        <motion.div className="idcard" style={{ rotate: cardRot, y: cardY }} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: 'spring' }}>{card}</motion.div>
      )}
      {variant === 'drop' && <Tape className="ink" base={0.8} tilt={1.6}>{['FIT CHECK', 'NO LUXURY TAX', 'PICK YOUR LANE'].map(t => <Fragment key={t}><b>{t}</b><i>✺</i></Fragment>)}</Tape>}
    </header>
  );
}

/* Big word that grows as the section scrolls into view. */
export function Shout({ children, to }) {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const s = useTransform(p, [0, 1], [0.45, 1]);
  const r = useTransform(p, [0, 1], [-6, 0]);
  return (
    <section ref={ref} className="shout">
      <motion.h2 style={{ scale: s, rotate: r }}>{children}</motion.h2>
      {to && <Link to={to.href} className="btn btn-gold big">{to.label}</Link>}
    </section>
  );
}
