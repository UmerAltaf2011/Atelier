import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';
import { useApp } from '../store.jsx';
import { currencyName } from '../lib/format.js';

const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'PKR', 'INR', 'CAD', 'AUD', 'CHF', 'SAR', 'CNY'];

export default function CurrencyDialog() {
  const { currencyOpen, setCurrencyOpen, rates, state, setCurrency, resetCurrencyAuto } = useApp();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const codes = Object.keys(rates.rates);
    const rank = c => (POPULAR.includes(c) ? POPULAR.indexOf(c) : 99);
    return codes
      .filter(c => !q || c.toLowerCase().includes(q.toLowerCase()) || currencyName(c).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [rates, q]);

  const close = () => setCurrencyOpen(false);
  return (
    <AnimatePresence>
      {currencyOpen && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div className="dialog" role="dialog" aria-modal="true" aria-label="Choose currency"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h3>Currency</h3>
                <p>{Object.keys(rates.rates).length} currencies · {rates.live ? 'live rates' : 'cached rates'}{rates.updated ? ` · ${rates.updated.slice(0, 16)}` : ''}</p>
              </div>
              <button className="icon-btn" onClick={close} aria-label="Close"><X size={18} /></button>
            </div>
            <label className="search-field">
              <Search size={16} />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search a currency or country…" />
            </label>
            <button className="btn btn-line btn-sm" onClick={() => { resetCurrencyAuto(); close(); }}>
              {state.currencyAuto ? '✓ ' : ''}Follow my location automatically
            </button>
            <ul className="currency-list">
              {list.map(code => (
                <li key={code}>
                  <button className={code === state.currency ? 'on' : ''} onClick={() => { setCurrency(code); close(); }}>
                    <b>{code}</b>
                    <span>{currencyName(code)}</span>
                    <em>{rates.rates[code] >= 100 ? Math.round(rates.rates[code]).toLocaleString() : Number(rates.rates[code]).toFixed(3)}</em>
                    {code === state.currency && <Check size={15} />}
                  </button>
                </li>
              ))}
              {!list.length && <li className="muted pad">No currency matches “{q}”.</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
