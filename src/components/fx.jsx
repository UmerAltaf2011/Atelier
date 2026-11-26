import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';

// Spray-paint splats that drift at different speeds as you scroll (depth without images).
export function StreetBackdrop() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -520]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 340]);
  const r = useTransform(scrollYProgress, [0, 1], [0, 90]);
  return (
    <div className="street-backdrop" aria-hidden="true">
      <motion.i className="splat sp1" style={{ y: y1, rotate: r }} />
      <motion.i className="splat sp2" style={{ y: y2 }} />
    </div>
  );
}

// Square crosshair cursor that flips to a label on interactive things. Hidden on touch screens.
export function CursorBlob() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 30, mass: 0.3 }), sy = useSpring(y, { stiffness: 420, damping: 30, mass: 0.3 });
  const [big, setBig] = useState(false);
  const [touch, setTouch] = useState(true);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    setTouch(false);
    const mv = e => { x.set(e.clientX); y.set(e.clientY); setBig(!!e.target.closest?.('a,button,[role="button"],input,select,label')); };
    window.addEventListener('mousemove', mv);
    return () => window.removeEventListener('mousemove', mv);
  }, [x, y]);
  if (touch) return null;
  return <motion.div className="cursor-blob" style={{ x: sx, y: sy }} animate={{ scale: big ? 2.2 : 1, rotate: big ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} aria-hidden="true" />;
}

// Intro: a 0-100 counter over a black wall, then the wall peels up.
export function Preloader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('atelier-intro'));
  const n = useMotionValue(0);
  const [num, setNum] = useState(0);
  const bar = useTransform(n, [0, 100], [0, 1]);
  useEffect(() => {
    if (!show) return undefined;
    const c = animate(n, 100, { duration: 1.4, ease: 'easeInOut', onUpdate: v => setNum(Math.round(v)) });
    const t = setTimeout(() => { setShow(false); try { sessionStorage.setItem('atelier-intro', '1'); } catch { /* ignore */ } }, 1700);
    return () => { c.stop(); clearTimeout(t); };
  }, [show, n]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="preloader" initial={{ clipPath: 'inset(0 0 0 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}>
          <motion.div className="pre-word" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>ATELIER</motion.div>
          <div className="pre-row"><span>wear your block</span><b>{String(num).padStart(3, '0')}</b></div>
          <div className="pre-bar"><motion.i style={{ scaleX: bar }} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
