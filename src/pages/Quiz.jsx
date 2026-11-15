import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../store.jsx';
import useTitle from '../lib/useTitle.js';

const QUESTIONS = [
  { q: 'Which silhouette feels most like you?', key: 'vibe', options: [
    { title: 'Relaxed tailoring', desc: 'Wide trousers, soft shoulders, architectural drape.', archetype: 'Architectural Minimalist' },
    { title: 'Utilitarian layers', desc: 'Technical outerwear, overshirts, functional proportions.', archetype: 'Modernist Utilitarian' },
    { title: 'Resort & textural', desc: 'Open-weave linen, coastal ease, organic lines.', archetype: 'Sartorial Nomad' },
    { title: 'Sharp & statement', desc: 'Bold cuts, rich fabrics, one hero piece per outfit.', archetype: 'Editorial Maximalist' },
  ] },
  { q: 'Choose your colour discipline.', key: 'palette', options: [
    { title: 'Obsidian, Bone & Raw Camel', desc: 'High-contrast neutrals with warm suede and wool.', palette: 'Obsidian, Bone & Raw Camel', swatches: ['#14110f', '#e9e0d0', '#b98c5a'] },
    { title: 'Ecru, Sage & Faded Indigo', desc: 'Sun-washed, earthy tones for easy daytime dressing.', palette: 'Ecru, Sage & Faded Indigo', swatches: ['#efe8d8', '#9aa88a', '#4a5f82'] },
    { title: 'Noir & Burnished Graphite', desc: 'Dark leathers, charcoal knits, evening restraint.', palette: 'Noir & Burnished Graphite', swatches: ['#0b0b0c', '#3a3d42', '#8b8f96'] },
    { title: 'Terracotta, Cream & Olive', desc: 'Warm, grounded and quietly rich.', palette: 'Terracotta, Cream & Olive', swatches: ['#b5593c', '#f1e6d3', '#6b6b3a'] },
  ] },
  { q: 'Where will you wear it most?', key: 'occasion', options: [
    { title: 'Everyday', desc: 'Smart-casual rotation for the city.', occasion: 'Everyday' },
    { title: 'Office & meetings', desc: 'Polished, credible, comfortable all day.', occasion: 'Office' },
    { title: 'Evenings & events', desc: 'Weddings, dinners, nights out.', occasion: 'Evening' },
    { title: 'Travel', desc: 'Light, layered and easy to mix.', occasion: 'Travel' },
  ] },
  { q: 'Which brand tier fits you?', key: 'tier', options: [
    { title: 'Heritage luxury', desc: 'Houses with archives: Lemaire, Gucci, Loewe.', budgetTier: 'Luxury Houses', tierFilter: 'Luxury' },
    { title: 'Balanced mix', desc: 'Contemporary staples plus statement pieces.', budgetTier: 'Contemporary & Luxury', tierFilter: '' },
    { title: 'Contemporary & street', desc: 'Elevated everyday icons and sport-luxe.', budgetTier: 'Contemporary & Street', tierFilter: '' },
    { title: 'Smart high street', desc: 'Great design without the price tag.', budgetTier: 'High Street Smart', tierFilter: 'High Street' },
  ] },
];

export default function Quiz() {
  useTitle('Style DNA — Atelier');
  const { updateState, state } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const q = QUESTIONS[step];
  const choose = opt => {
    const next = { ...answers, ...opt };
    if (step === 0) next.silhouette = opt.title;
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) { setStep(step + 1); return; }
    updateState({
      dna: {
        archetype: next.archetype, palette: next.palette, swatches: next.swatches, silhouette: next.silhouette,
        occasion: next.occasion, budgetTier: next.budgetTier, completed: true,
      },
    });
    setDone(true);
  };
  const dna = state.dna;
  const tierFilter = QUESTIONS[3].options.find(o => o.budgetTier === dna.budgetTier)?.tierFilter;

  return (
    <section className="quiz">
      <div className="quiz-progress"><motion.span animate={{ width: `${done ? 100 : (step / QUESTIONS.length) * 100}%` }} transition={{ duration: 0.6 }} /></div>
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={step} className="quiz-step" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
            <div className="eyebrow">Question {step + 1} of {QUESTIONS.length}</div>
            <h1 className="quiz-q">{q.q}</h1>
            <div className="quiz-options">
              {q.options.map((o, i) => (
                <motion.button key={o.title} className="q-opt" onClick={() => choose(o)} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <span className="q-n">0{i + 1}</span>
                  {o.swatches && <span className="swatches">{o.swatches.map(c => <i key={c} style={{ background: c }}></i>)}</span>}
                  <b>{o.title}</b>
                  <p>{o.desc}</p>
                </motion.button>
              ))}
            </div>
            {step > 0 && <button className="link-arrow sm back" onClick={() => setStep(step - 1)}>← Back</button>}
          </motion.div>
        ) : (
          <motion.div key="result" className="quiz-result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <div className="eyebrow gold">Style DNA encoded & saved</div>
            <h1 className="quiz-q big">You are an<br /><em>{dna.archetype}.</em></h1>
            <div className="swatches big">{(dna.swatches || []).map((c, i) => <motion.i key={c} style={{ background: c }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.12, type: 'spring' }}></motion.i>)}</div>
            <div className="result-specs">
              <div><small>Palette</small><b>{dna.palette}</b></div>
              <div><small>Silhouette</small><b>{dna.silhouette}</b></div>
              <div><small>Occasion</small><b>{dna.occasion}</b></div>
              <div><small>Brand tier</small><b>{dna.budgetTier}</b></div>
            </div>
            <div className="result-cta">
              <Link to={`/shop${tierFilter ? `?tier=${encodeURIComponent(tierFilter)}` : ''}`} className="btn btn-gold">Show my matches <ArrowRight size={17} /></Link>
              <Link to="/wardrobe" className="btn btn-ghost-light">Open wardrobe</Link>
              <button className="btn btn-ghost-light" onClick={() => { setStep(0); setAnswers({}); setDone(false); }}>Retake</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
