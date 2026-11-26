import { env } from './lib/env.js';
import { fetchJson } from './lib/http.js';
import { ARCHETYPES, ARCH_BY_ID, ARCH_IDS } from './data/archetypes.js';

export const QUIZ_LENGTH = 6;

// o(label, description, weights, extra)
const o = (label, desc, weights, set) => ({ label, desc, weights, ...(set ? { set } : {}) });

const BANK = [
  { id: 'saturday', text: 'It is Saturday and nothing is planned. Where do you end up?', options: [
    o('Coffee run and a long walk', 'Comfy layers, clean sneakers.', { casual: 3, minimalism: 2, athleisure: 1 }),
    o('A gallery, then a bookshop', 'Textures, knits, a good coat.', { 'dark-academia': 3, minimalism: 2, 'quiet-luxury': 2 }),
    o('A rooftop with friends', 'Dress up, stand out.', { starboy: 3, y2k: 2, 'desi-festive': 1 }),
    o('A flea market or thrift crawl', 'Hunting for something nobody else has.', { 'retro-vintage': 3, boho: 2, grunge: 2 }),
  ] },
  { id: 'jacket', text: 'Pick the jacket you would never give back.', options: [
    o('Waxed field jacket', 'Weathered, heritage, practical.', { 'old-money': 3, gorpcore: 2, 'dark-academia': 1 }),
    o('Black leather biker', 'Sharp, slightly dangerous.', { starboy: 3, grunge: 3 }),
    o('Technical shell', 'Waterproof, zips everywhere.', { gorpcore: 3, athleisure: 2, streetwear: 1 }),
    o('Soft unstructured blazer', 'Looks expensive, feels like a cardigan.', { 'quiet-luxury': 3, 'business-casual': 2, minimalism: 2 }),
  ] },
  { id: 'fabric', text: 'Which fabric do your hands go to first?', options: [
    o('Lawn, cotton or khaddar', 'Breathable and made for the climate.', { 'desi-classic': 3, casual: 2, floral: 1 }),
    o('Silk, zari and velvet', 'Anything with a shimmer.', { 'desi-festive': 3, starboy: 1, 'quiet-luxury': 1 }),
    o('Cashmere and fine wool', 'Soft, neutral, forever.', { 'quiet-luxury': 3, 'old-money': 3 }),
    o('Heavy denim and cotton jersey', 'The harder it is to wear out, the better.', { casual: 2, streetwear: 2, grunge: 2, 'retro-vintage': 1 }),
  ] },
  { id: 'colour', text: 'Choose a colour mood.', options: [
    o('Bone, oat and charcoal', 'Muted and calm.', { minimalism: 3, 'quiet-luxury': 3 }),
    o('Pink, sky and silver', 'Candy shop sparkle.', { y2k: 3, floral: 2, preppy: 1 }),
    o('Rust, olive and mustard', 'Autumn all year.', { boho: 3, 'retro-vintage': 3, gorpcore: 1 }),
    o('Black, red and chrome', 'Nightlife palette.', { starboy: 3, grunge: 2, streetwear: 1 }),
  ] },
  { id: 'shoes', text: 'Your forever shoe is…', options: [
    o('Leather loafers', 'Polished and timeless.', { 'old-money': 3, 'business-casual': 2, preppy: 2 }),
    o('Chunky sneakers', 'Statement soles.', { streetwear: 3, athleisure: 2, y2k: 1 }),
    o('Khussa or Peshawari chappal', 'Craft you can walk in.', { 'desi-classic': 3, 'desi-festive': 2, boho: 1 }),
    o('Combat boots', 'Scuffed on purpose.', { grunge: 3, 'dark-academia': 2, starboy: 1 }),
  ] },
  { id: 'night', text: 'Describe your perfect evening look in one phrase.', options: [
    o('Wedding-season glow', 'Embroidery and heirloom jewellery.', { 'desi-festive': 3, floral: 1 }),
    o('Main character energy', 'Shades on after dark.', { starboy: 3, y2k: 2 }),
    o('Effortless dinner date', 'One great piece, nothing loud.', { minimalism: 2, 'quiet-luxury': 2, 'old-money': 2 }),
    o('Garden party romantic', 'Florals and flowy.', { floral: 3, boho: 2, 'retro-vintage': 1 }),
  ] },
  { id: 'bag', text: 'What is always in your bag?', options: [
    o('A paperback and a pen', 'Slightly rumpled and well loved.', { 'dark-academia': 3, minimalism: 1, boho: 1 }),
    o('Gym kit', 'Never know when a session happens.', { athleisure: 3, gorpcore: 1, casual: 1 }),
    o('Sunglasses, lip balm, a hair clip', 'Small things, big sparkle.', { y2k: 2, starboy: 2, floral: 1 }),
    o('A scarf or dupatta', 'For weather, for style, for everything.', { 'desi-classic': 3, 'old-money': 1, boho: 1 }),
  ] },
  { id: 'era', text: 'Which era had the best wardrobe?', options: [
    o('1970s', 'Flares, corduroy and big collars.', { 'retro-vintage': 3, boho: 2 }),
    o('1990s', 'Flannel, baggy jeans, slip dresses.', { grunge: 3, minimalism: 1, casual: 1 }),
    o('Early 2000s', 'Low rise, rhinestones and Juicy.', { y2k: 3, athleisure: 1 }),
    o('1950s to 60s', 'Tailoring and good manners.', { 'old-money': 3, preppy: 2, 'business-casual': 1 }),
  ] },
  { id: 'shop', text: 'How do you shop?', options: [
    o('One expensive piece a season', 'Buy once, wear for years.', { 'quiet-luxury': 3, 'old-money': 2, minimalism: 1 }),
    o('Drops, queues and limited runs', 'If it is not rare, it is not it.', { streetwear: 3, starboy: 2 }),
    o('Lawn season sales', 'Stock up, mix and match all year.', { 'desi-classic': 3, floral: 1, casual: 1 }),
    o('Thrift and vintage', 'Stories over labels.', { 'retro-vintage': 3, grunge: 2, boho: 2 }),
  ] },
  { id: 'pattern', text: 'Pick a pattern.', options: [
    o('Small florals', 'Soft and sweet.', { floral: 3, boho: 1, 'retro-vintage': 1 }),
    o('Stripes and checks', 'Crisp, collegiate.', { preppy: 3, 'business-casual': 2, 'dark-academia': 1 }),
    o('Block print and embroidery', 'Handwork you can see.', { 'desi-classic': 3, boho: 2, 'desi-festive': 1 }),
    o('No pattern at all', 'Texture and cut do the talking.', { minimalism: 3, 'quiet-luxury': 2 }),
  ] },
  { id: 'logo', text: 'How do you feel about logos?', options: [
    o('Big and proud', 'If it is a flex, wear it.', { streetwear: 3, starboy: 2, y2k: 1 }),
    o('Small and tasteful', 'A tiny embroidered something.', { preppy: 3, casual: 2, athleisure: 1 }),
    o('None, please', 'Quality should be obvious.', { 'quiet-luxury': 3, minimalism: 3 }),
    o('Only on vintage pieces', 'Faded and worn in.', { 'retro-vintage': 3, grunge: 2 }),
  ] },
  { id: 'weather', text: 'Your ideal weather to dress for?', options: [
    o('Crisp autumn with rain', 'Trench coats and boots.', { 'dark-academia': 3, 'old-money': 2, gorpcore: 1 }),
    o('Scorching and sunny', 'Light, loose, breathable.', { 'desi-classic': 2, boho: 2, floral: 2, casual: 1 }),
    o('Cold and snowy', 'Big technical layers.', { gorpcore: 3, streetwear: 1, athleisure: 1 }),
    o('Mild and golden hour', 'Anything works.', { minimalism: 2, casual: 2, preppy: 1 }),
  ] },
  { id: 'work', text: 'Where do you spend most of your days?', options: [
    o('An office with a loose dress code', 'Polished, not stiff.', { 'business-casual': 3, 'quiet-luxury': 1, preppy: 1 }, { occasion: 'Office' }),
    o('A campus or studio', 'Creative and comfortable.', { 'dark-academia': 2, casual: 2, boho: 1 }, { occasion: 'Everyday' }),
    o('Out and about, moving', 'Practical wins.', { athleisure: 2, gorpcore: 2, streetwear: 1 }, { occasion: 'Travel' }),
    o('Events, weddings and gatherings', 'Dressing up is a calendar item.', { 'desi-festive': 3, floral: 1, starboy: 1 }, { occasion: 'Evening' }),
  ] },
  { id: 'accessory', text: 'Choose one accessory.', options: [
    o('A classic watch', 'Quietly says a lot.', { 'old-money': 3, 'business-casual': 2 }),
    o('Chunky silver chain', 'Never taking it off.', { starboy: 3, streetwear: 2, grunge: 1 }),
    o('Layered gold necklaces', 'A little sparkle.', { y2k: 2, boho: 2, floral: 1 }),
    o('A woven bag', 'Handmade and slightly slouchy.', { boho: 3, 'desi-classic': 1, minimalism: 1 }),
  ] },
];

const BUDGET = [
  { text: 'What does a good outfit budget look like?', options: [
    ['Designer and heritage houses', 'Luxury Houses', 'Luxury'],
    ['A smart mix of high and low', 'Contemporary & Luxury', ''],
    ['Contemporary labels and streetwear', 'Contemporary & Street', ''],
    ['Great design without the price tag', 'High Street Smart', 'High Street'],
  ] },
  { text: 'Last one: where do you like to spend?', options: [
    ['I invest in the best', 'Luxury Houses', 'Luxury'],
    ['Some splurges, some savers', 'Contemporary & Luxury', ''],
    ['Mid-range and trend-led', 'Contemporary & Street', ''],
    ['Keep it affordable', 'High Street Smart', 'High Street'],
  ] },
];

const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const topIds = (scores, n = 3) => Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id);

function fromBank(asked, seenIds) {
  const fresh = BANK.filter(q => !asked.includes(q.id) && !seenIds.includes(q.id));
  const pool = fresh.length ? fresh : BANK.filter(q => !asked.includes(q.id));
  const q = pick(pool);
  return { id: q.id, text: q.text, options: shuffle(q.options) };
}

function budgetQuestion() {
  const q = pick(BUDGET);
  return {
    id: 'budget', text: q.text, kind: 'budget',
    options: q.options.map(([label, budgetTier, tierFilter]) => ({ label, desc: '', weights: {}, set: { budgetTier, tierFilter } })),
  };
}

export const aiAvailable = () => !!(env('ANTHROPIC_API_KEY') || env('OPENAI_API_KEY'));

async function askModel(prompt) {
  if (env('ANTHROPIC_API_KEY')) {
    const d = await fetchJson('https://api.anthropic.com/v1/messages', {
      method: 'POST', timeout: 14_000,
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'), max_tokens: 700, temperature: 1, messages: [{ role: 'user', content: prompt }] }),
    });
    return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  const d = await fetchJson('https://api.openai.com/v1/chat/completions', {
    method: 'POST', timeout: 14_000,
    headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: env('OPENAI_MODEL', 'gpt-4o-mini'), max_tokens: 700, temperature: 1, messages: [{ role: 'user', content: prompt }] }),
  });
  return d.choices?.[0]?.message?.content || '';
}

async function fromAi({ scores, askedTexts, pastTexts, step }) {
  const leaders = topIds(scores, 3).filter(id => scores[id] > 0);
  const prompt = [
    'You are a playful fashion stylist writing ONE multiple-choice question for a style quiz.',
    `Style archetype ids you can score: ${ARCH_IDS.join(', ')}.`,
    leaders.length ? `So far the leading archetypes are: ${leaders.join(', ')}. Write a question that helps separate them.` : 'This is an early question: probe a broad, fun dimension of taste (not just clothes: music, places, mood, habits).',
    `This is question ${step + 1} of ${QUIZ_LENGTH}.`,
    `Do NOT repeat or paraphrase any of these earlier questions: ${JSON.stringify([...askedTexts, ...pastTexts].slice(-30))}.`,
    'Be original and specific, under 14 words. Provide exactly 4 options. Each option has a short label (max 6 words), a one-line description (max 12 words), and weights: an object mapping 1 to 3 archetype ids to a score from 1 to 3.',
    'Reply with ONLY JSON, no markdown: {"text":"...","options":[{"label":"...","desc":"...","weights":{"id":2}}]}',
  ].join('\n');
  const raw = await askModel(prompt);
  const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  const text = String(json.text || '').trim().slice(0, 140);
  const options = (json.options || []).slice(0, 4).map(op => {
    const weights = {};
    for (const [id, w] of Object.entries(op.weights || {})) if (ARCH_BY_ID[id]) weights[id] = Math.max(1, Math.min(3, Math.round(Number(w) || 1)));
    return { label: String(op.label || '').slice(0, 60), desc: String(op.desc || '').slice(0, 100), weights };
  });
  if (!text || options.length !== 4 || options.some(x => !x.label || !Object.keys(x.weights).length)) throw new Error('bad model question');
  return { id: `ai_${Date.now().toString(36)}`, text, options, ai: true };
}

// asked: [{id, text}], scores: {archetypeId: number}; seen: {ids, texts} from earlier sessions
export async function nextQuestion({ asked = [], scores = {}, seen = { ids: [], texts: [] } }) {
  const step = asked.length;
  if (step >= QUIZ_LENGTH) return { done: true, total: QUIZ_LENGTH };
  if (step === QUIZ_LENGTH - 1) return { question: budgetQuestion(), step, total: QUIZ_LENGTH, source: 'built-in' };
  const askedIds = asked.map(a => a.id);
  if (aiAvailable()) {
    try {
      const q = await fromAi({ scores, askedTexts: asked.map(a => a.text), pastTexts: seen.texts || [], step });
      return { question: q, step, total: QUIZ_LENGTH, source: 'AI' };
    } catch (e) { console.warn('[quiz] AI question failed, using bank:', e.message); }
  }
  return { question: fromBank(askedIds, seen.ids || []), step, total: QUIZ_LENGTH, source: 'built-in' };
}

export function finish({ scores = {}, set = {} }) {
  const noisy = Object.fromEntries(ARCH_IDS.map(id => [id, (Number(scores[id]) || 0) + Math.random() * 0.01]));
  const [first, second] = topIds(noisy, 2);
  const a = ARCH_BY_ID[first], r = ARCH_BY_ID[second];
  const total = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  return {
    archetypeId: a.id, archetype: a.name, runnerUpId: r.id, runnerUp: r.name,
    palette: a.palette, swatches: a.swatches, silhouette: a.silhouette,
    occasion: set.occasion || 'Everyday', budgetTier: set.budgetTier || 'Contemporary & Luxury', tierFilter: set.tierFilter || '',
    match: Math.min(99, Math.round(((Number(scores[a.id]) || 0) / total) * 100 + 55)),
    completed: true,
  };
}

export { ARCHETYPES };
