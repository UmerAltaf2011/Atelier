import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import { useApiData } from '../lib/hooks.js';
import { Tape } from '../components/street.jsx';
import useTitle from '../lib/useTitle.js';

const Mannequin3D = lazy(() => import('../components/Mannequin3D.jsx'));
const EMOJI = ['🍬', '🎧', '🌈', '🪩'];

// Questions are generated per run (AI when a key is set, a shuffled bank otherwise)
// and never repeat the ones this account has already seen.
export default function Quiz() {
  useTitle('Find your style — Atelier');
  const { state, updateState, online } = useApp();
  const archetypes = useApiData('/archetypes').data?.archetypes || [];

  const [phase, setPhase] = useState('intro'); // intro | asking | result
  const [asked, setAsked] = useState([]);
  const [scores, setScores] = useState({});
  const [setBag, setSetBag] = useState({});
  const [q, setQ] = useState(null);
  const [meta, setMeta] = useState({ step: 0, total: 6, source: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchNext = useCallback(async (askedNow, scoresNow) => {
    setLoading(true); setError('');
    try {
      const r = await api('/quiz/next', { method: 'POST', body: { asked: askedNow, scores: scoresNow } });
      if (r.done) return r;
      setQ(r.question); setMeta({ step: r.step, total: r.total, source: r.source });
      return r;
    } catch (e) { setError(e.message || 'Could not load the next question'); return null; }
    finally { setLoading(false); }
  }, []);

  const start = async () => {
    setAsked([]); setScores({}); setSetBag({}); setResult(null); setQ(null);
    setPhase('asking');
    await fetchNext([], {});
  };

  const choose = async opt => {
    const nextScores = { ...scores };
    for (const [id, w] of Object.entries(opt.weights || {})) nextScores[id] = (nextScores[id] || 0) + w;
    const nextSet = { ...setBag, ...(opt.set || {}) };
    const nextAsked = [...asked, { id: q.id, text: q.text }];
    setScores(nextScores); setSetBag(nextSet); setAsked(nextAsked);
    const r = await fetchNext(nextAsked, nextScores);
    if (r?.done) {
      try {
        const fin = await api('/quiz/finish', { method: 'POST', body: { scores: nextScores, set: nextSet } });
        updateState({ dna: fin.dna });
        setResult(fin);
        setPhase('result');
      } catch (e) { setError(e.message || 'Could not save your result'); }
    }
  };

  useEffect(() => { if (phase === 'intro' && state.dna.completed && !result) setResult({ dna: state.dna, tierFilter: '' }); }, [phase, state.dna, result]);

  const dnaArch = (id) => archetypes.find(a => a.id === id);
  const shown = result ? dnaArch(result.dna.archetypeId) : null;
  const runner = result ? dnaArch(result.dna.runnerUpId) : null;

  return (
    <>
    <Tape className="hazard quiz-tape" tilt={-1.2}>{['FIT CHECK', 'SIX QUESTIONS', 'NEVER THE SAME TWICE'].map(t => <span key={t}><b>{t}</b><i>✦</i></span>)}</Tape>
    <section className="quiz">
      <div className="quiz-progress">
        <motion.span animate={{ width: `${phase === 'result' ? 100 : phase === 'asking' ? (meta.step / meta.total) * 100 : 0}%` }} transition={{ duration: 0.6 }} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" className="quiz-step" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
            <div className="eyebrow">Style quiz</div>
            <h1 className="quiz-q">What's your <em>lane?</em></h1>
            <p className="lead" style={{ color: 'rgba(255,255,255,.7)', marginBottom: 28 }}>
              Six quick, playful questions. They're different every time you play, so retake it whenever your mood changes.
            </p>
            <div className="vibe-grid">
              {archetypes.map((a, i) => (
                <motion.span key={a.id} className="vibe" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03, type: 'spring' }} whileHover={{ rotate: -4, scale: 1.08 }}>
                  <span className="e">{a.emoji}</span>{a.name}
                </motion.span>
              ))}
            </div>
            <motion.button className="btn btn-gold big" onClick={start} disabled={!online} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {state.dna.completed ? 'Retake the quiz' : 'Start the quiz'} <ArrowRight size={18} />
            </motion.button>
            {!online && <p className="muted small" style={{ marginTop: 12 }}>The server is unreachable, so the quiz can't load right now.</p>}
            {state.dna.completed && shown && (
              <p style={{ marginTop: 26, color: 'rgba(255,255,255,.8)' }}>
                Right now you're <b>{shown.emoji} {shown.name}</b>. <button className="link-btn" onClick={() => setPhase('result')}>See it in 3D</button>
              </p>
            )}
          </motion.div>
        )}

        {phase === 'asking' && (
          <motion.div key={`q-${meta.step}-${q?.id || 'load'}`} className="quiz-step" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
            <div className="eyebrow">
              Question {Math.min(meta.step + 1, meta.total)} of {meta.total}
              {meta.source === 'AI' && <span className="q-ai"><Sparkles size={12} /> fresh from AI</span>}
            </div>
            {loading && !q && <h1 className="quiz-q">Thinking up a question…</h1>}
            {q && (
              <>
                <h1 className="quiz-q">{q.text}</h1>
                <div className="quiz-options" aria-busy={loading}>
                  {q.options.map((o, i) => (
                    <motion.button key={o.label} className="q-opt" onClick={() => choose(o)} disabled={loading}
                      whileHover={{ y: -8, rotate: i % 2 ? 1 : -1 }} whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07, type: 'spring', stiffness: 220, damping: 18 }}>
                      <span className="q-emoji">{EMOJI[i % 4]}</span>
                      {q.kind === 'budget' ? null : <span className="q-n">0{i + 1}</span>}
                      <b>{o.label}</b>
                      {o.desc && <p>{o.desc}</p>}
                    </motion.button>
                  ))}
                </div>
              </>
            )}
            {error && (
              <p className="form-error" style={{ marginTop: 18 }}>
                {error} <button className="link-btn" onClick={() => fetchNext(asked, scores)}>Try again</button>
              </p>
            )}
          </motion.div>
        )}

        {phase === 'result' && result && shown && (
          <motion.div key="result" className="quiz-result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="result-card">
              <div className="studio-stage" style={{ '--stage': shown.swatches[0] }}>
                <Suspense fallback={<div className="mannequin" style={{ height: 460 }} />}>
                  <Mannequin3D archetype={shown} height={460} />
                </Suspense>
                <div className="studio-hint">drag to spin</div>
              </div>
              <div>
                {result.match && <span className="match-pill">{result.match}% match</span>}
                <div className="eyebrow gold">Style saved to your account</div>
                <h1 className="quiz-q big">{shown.emoji} {shown.name}<br /><em>{shown.tagline}</em></h1>
                <div className="swatches big">{shown.swatches.map((c, i) => <motion.i key={c} style={{ background: c }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.12, type: 'spring' }} />)}</div>
                <div className="result-specs">
                  <div><small>Palette</small><b>{shown.palette}</b></div>
                  <div><small>Silhouette</small><b>{shown.silhouette}</b></div>
                  {runner && <div><small>Also a bit</small><b>{runner.emoji} {runner.name}</b></div>}
                  <div><small>Brand tier</small><b>{result.dna.budgetTier}</b></div>
                </div>
                <div className="result-cta">
                  <Link to={`/shop?style=${shown.id}`} className="btn btn-gold">Shop my style <ArrowRight size={17} /></Link>
                  <Link to="/wardrobe" className="btn btn-ghost-light">Open wardrobe</Link>
                  <button className="btn btn-ghost-light" onClick={start}>Play again</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
    </>
  );
}
