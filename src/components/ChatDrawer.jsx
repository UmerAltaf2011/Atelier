import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import Img from './Img.jsx';

const PROMPTS = [
  'What should I wear today?',
  'Wedding outfit under 300 USD',
  'Build me a travel capsule',
  'Smart casual for the office',
];

function Typed({ text, onTick }) {
  const words = text.split(' ');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= words.length) return undefined;
    const t = setTimeout(() => { setN(n + 1); onTick?.(); }, 28);
    return () => clearTimeout(t);
  }, [n, words.length, onTick]);
  return <>{words.slice(0, n).join(' ')}</>;
}

export default function ChatDrawer() {
  const { chat, closeChat, state, weather, fmt, openProduct, online } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typingId, setTypingId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);
  const lastSeed = useRef('');

  const toBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!chat.open || loaded || !online) return;
    api('/chat/history').then(r => { setMessages(r.messages || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, [chat.open, loaded, online]);
  useEffect(() => { toBottom(); }, [messages, busy, toBottom]);

  const send = useCallback(async text => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setMessages(m => [...m, { role: 'user', content: message, ts: Date.now() }]);
    try {
      const w = weather ? { tempC: weather.tempC, summary: weather.summary, advice: weather.advice } : undefined;
      const r = await api('/chat', { method: 'POST', body: { message, context: { weather: w } } });
      const ts = Date.now();
      setTypingId(ts);
      setMessages(m => [...m, { role: 'assistant', content: r.reply, products: r.products, source: r.source, ts }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: e.message || 'I could not reach the server. Please try again.', ts: Date.now(), error: true }]);
    } finally { setBusy(false); }
  }, [busy, weather]);

  // Seeded prompts (e.g. "Ask the stylist" on a product)
  useEffect(() => {
    if (chat.open && chat.seed && chat.seed !== lastSeed.current && loaded) { lastSeed.current = chat.seed; send(chat.seed); }
    if (!chat.open) lastSeed.current = '';
  }, [chat.open, chat.seed, loaded, send]);

  const clear = async () => {
    try { await api('/chat/history', { method: 'DELETE' }); } catch { /* ignore */ }
    setMessages([]);
  };

  return (
    <AnimatePresence>
      {chat.open && (
        <>
          <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeChat} />
          <motion.aside className="drawer" role="dialog" aria-label="AI stylist"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }}>
            <div className="drawer-head">
              <div className="avatar"><Sparkles size={18} /></div>
              <div>
                <h3>Atelier Stylist</h3>
                <p>{state.dna.archetype}{weather ? ` · ${weather.tempC}°C in ${state.location?.city || 'your city'}` : ''}</p>
              </div>
              <button className="icon-btn" onClick={clear} aria-label="Clear conversation" title="Clear conversation"><Trash2 size={16} /></button>
              <button className="icon-btn" onClick={closeChat} aria-label="Close"><X size={18} /></button>
            </div>

            <div className="drawer-list" ref={listRef}>
              {!messages.length && (
                <div className="chat-empty">
                  <Sparkles size={26} />
                  <h4>Ask me anything about what to wear.</h4>
                  <p>I know your style DNA, your city's weather and your saved pieces. Conversations are saved to your account.</p>
                  <div className="chips">{PROMPTS.map(p => <button key={p} onClick={() => send(p)}>{p}</button>)}</div>
                </div>
              )}
              {messages.map(m => (
                <motion.div key={m.ts + m.role} className={`msg ${m.role}${m.error ? ' error' : ''}`}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bubble">{m.ts === typingId ? <Typed text={m.content} onTick={toBottom} /> : m.content}</div>
                  {m.products?.length > 0 && (
                    <div className="mini-products">
                      {m.products.map(p => (
                        <button key={p.id} className="mini" onClick={() => openProduct(p)}>
                          <Img src={p.image} name={p.name} loading="eager" />
                          <span><b>{p.brand}</b>{p.name}<em>{fmt(p.priceUsd)}</em></span>
                        </button>
                      ))}
                    </div>
                  )}
                  {m.source && m.role === 'assistant' && <small className="src">{m.source}</small>}
                </motion.div>
              ))}
              {busy && <div className="msg assistant"><div className="bubble typing"><i></i><i></i><i></i></div></div>}
            </div>

            <form className="drawer-form" onSubmit={e => { e.preventDefault(); send(input); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Describe an occasion, mood or budget…" maxLength={600} />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send size={17} /></button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
