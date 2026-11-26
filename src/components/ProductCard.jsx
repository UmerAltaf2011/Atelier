import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useApp } from '../store.jsx';
import { matchScore } from '../lib/format.js';
import Img from './Img.jsx';

export default function ProductCard({ item, index = 0 }) {
  const { fmt, savedIds, toggleSaved, openProduct, state } = useApp();
  const ref = useRef(null);
  const saved = savedIds.has(item.id);
  const hover = item.images?.[1] || null;

  const tilt = e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`);
    el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 9}deg`);
  };
  const reset = () => { ref.current?.style.setProperty('--rx', '0deg'); ref.current?.style.setProperty('--ry', '0deg'); };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.6, delay: Math.min(index % 12, 8) * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
      className="p-card-wrap"
    >
      <div className="p-card" ref={ref} onMouseMove={tilt} onMouseLeave={reset}>
        <div className="p-media" onClick={() => openProduct(item)} role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && openProduct(item)}>
          <Img className="p-img" src={item.image} name={item.name} />
          {hover && <Img className="p-img p-img-alt" src={hover} name={item.name} />}
          <span className="p-badge">{matchScore(item, state.dna)}% match</span>
          {item.illustrative ? <span className="p-live"><i></i> Curated</span> : <span className="p-live"><i></i> Live</span>}
        </div>
        <motion.button
          className={`p-heart${saved ? ' on' : ''}`}
          whileHover={{ scale: 1.2, rotate: 8 }}
          whileTap={{ scale: 0.75 }}
          onClick={() => toggleSaved(item)}
          aria-label={saved ? 'Remove from wardrobe' : 'Save to wardrobe'}
          aria-pressed={saved}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
        <div className="p-info" onClick={() => openProduct(item)}>
          <div className="p-brand"><span>{item.brand}</span><span>{item.category}</span></div>
          <h3 className="p-name">{item.name}</h3>
          <div className="p-price" title={item.illustrative ? 'Approximate price, check the brand for the real one' : `$${item.priceUsd.toFixed(2)} USD`}>{item.illustrative ? '≈ ' : ''}{fmt(item.priceUsd)}</div>
        </div>
      </div>
    </motion.article>
  );
}
