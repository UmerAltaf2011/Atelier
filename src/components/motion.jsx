import { Fragment, useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useSpring } from 'framer-motion';

const EASE = [0.2, 0.7, 0.2, 1];

export function Reveal({ children, delay = 0, y = 32, className, as = 'div', ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Word-by-word masked headline reveal. Wrap a word in _underscores_ to italicise it.
export function SplitText({ text, className, delay = 0 }) {
  return (
    <span className={className} aria-label={text.replace(/_/g, '')}>
      {text.split(' ').map((raw, i) => {
        const em = raw.startsWith('_') && raw.endsWith('_');
        const word = em ? raw.slice(1, -1) : raw;
        return (
          <Fragment key={i}>
            <span className="split-word" aria-hidden="true">
              <motion.span
                initial={{ y: '115%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.95, delay: delay + i * 0.08, ease: EASE }}
              >
                {em ? <em>{word}</em> : word}
              </motion.span>
            </span>{' '}
          </Fragment>
        );
      })}
    </span>
  );
}

export function Magnetic({ children, strength = 0.28 }) {
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 });
  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={e => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.span>
  );
}

export function CountUp({ to, suffix = '', duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    const controls = animate(0, to, {
      duration, ease: 'easeOut',
      onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix; },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

export function Marquee({ children, reverse = false, speed = 40, className = '' }) {
  return (
    <div className={`marquee ${className}`}>
      <div className="marquee-track" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        <div className="marquee-set">{children}</div>
        <div className="marquee-set" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
