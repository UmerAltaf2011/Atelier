import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Heart, Sparkles, X } from 'lucide-react';
import { useApp } from '../store.jsx';
import { brandUrl, matchScore } from '../lib/format.js';
import Img from './Img.jsx';

export default function ProductModal() {
  const { product, openProduct, fmt, savedIds, toggleSaved, openChat, state } = useApp();
  const [active, setActive] = useState(0);
  useEffect(() => { setActive(0); }, [product]);
  useEffect(() => {
    if (!product) return undefined;
    const onKey = e => e.key === 'Escape' && openProduct(null);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [product, openProduct]);

  const gallery = product ? [product.image, ...(product.images || [])].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 5) : [];
  const saved = product && savedIds.has(product.id);

  return (
    <AnimatePresence>
      {product && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => openProduct(null)}>
          <motion.div
            className="modal" role="dialog" aria-modal="true" aria-label={product.name}
            initial={{ y: 40, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => openProduct(null)} aria-label="Close"><X size={20} /></button>
            <div className="modal-gallery">
              <div className="modal-main"><Img key={gallery[active]} src={gallery[active]} name={product.name} loading="eager" /></div>
              {gallery.length > 1 && (
                <div className="modal-thumbs">
                  {gallery.map((g, i) => (
                    <button key={g} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}>
                      <Img src={g} name={product.name} loading="eager" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-body">
              <div className="eyebrow">{product.brand} · {product.tier}</div>
              <h2 className="modal-title">{product.name}</h2>
              <div className="modal-price">{fmt(product.priceUsd)} <small>${product.priceUsd.toFixed(2)} USD</small></div>
              <div className="modal-meta">
                <span>{matchScore(product, state.dna)}% match to your style DNA</span>
                <span>★ {Number(product.rating).toFixed(1)}</span>
                <span>{product.category}</span>
              </div>
              {product.description && <p className="modal-desc">{product.description}</p>}
              <div className="modal-actions">
                <button className={`btn btn-solid${saved ? ' is-on' : ''}`} onClick={() => toggleSaved(product)}>
                  <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'In your wardrobe' : 'Save to wardrobe'}
                </button>
                <button className="btn btn-line" onClick={() => { const n = product.name; openProduct(null); openChat(`How would you style the ${n}?`); }}>
                  <Sparkles size={16} /> Ask the stylist
                </button>
                <a className="btn btn-line" href={brandUrl(product)} target="_blank" rel="noreferrer noopener">
                  {product.brandDomain ? 'Brand site' : 'Find it online'} <ArrowUpRight size={16} />
                </a>
              </div>
              {product.illustrative && <p className="modal-note"><span className="tag-demo">Approximate price</span> This piece is from our curated catalogue. The name is typical of the brand's range, but the price and availability are estimates. Check the brand's site for the real listing.</p>}
              <p className="modal-note">Source: {product.source || 'live catalogue'}. Atelier links out to the brand; we never take a commission.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
