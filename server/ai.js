import { env } from './lib/env.js';
import { fetchJson } from './lib/http.js';
import { getAllProducts } from './providers/index.js';

export const aiProvider = () => (env('ANTHROPIC_API_KEY') ? 'Claude' : env('OPENAI_API_KEY') ? 'OpenAI' : 'Built-in stylist');

const CAT_RULES = [
  [/dress|gown|abaya|kurta|saree|sari/i, 'Dresses'],
  [/shoe|sneaker|loafer|boot|heel|footwear|sandal/i, 'Shoes'],
  [/\bbags?\b|tote|clutch|handbag/i, 'Bags'],
  [/watch/i, 'Watches'],
  [/jewel|necklace|ring\b|bracelet|earring/i, 'Jewellery'],
  [/sunglass|eyewear|glasses/i, 'Eyewear'],
  [/jacket|coat|blazer|outer|layer|parka|cold|winter/i, 'Outerwear'],
  [/shirt|\btops?\b|knit|\btee|sweater|linen/i, 'Tops'],
];

export function wantedCategories(text) {
  const cats = CAT_RULES.filter(([re]) => re.test(text)).map(([, c]) => c);
  return cats.length ? [...new Set(cats)] : ['Tops', 'Outerwear', 'Shoes'];
}

function parseBudget(text, rate = 1) {
  const m = text.match(/(?:under|below|less than|within|budget(?: of)?|max(?:imum)?)\s*(?:[a-z]{3}|[$€£¥])?\s*(\d[\d,]*)/i);
  return m ? Number(m[1].replace(/,/g, '')) / (rate || 1) : null;
}

const slim = i => ({
  id: i.id, name: i.name, brand: i.brand, category: i.category, gender: i.gender, priceUsd: i.priceUsd,
  rating: i.rating, image: i.image, tier: i.tier, brandDomain: i.brandDomain,
});

export async function pickProducts(text, { rate = 1, limit = 3 } = {}) {
  const { items } = await getAllProducts();
  const cats = wantedCategories(text);
  const budget = parseBudget(text, rate);
  const pool = items.filter(i => cats.includes(i.category) && (!budget || i.priceUsd <= budget));
  const seen = new Set();
  return (pool.length ? pool : items)
    .sort((a, b) => b.rating - a.rating)
    .filter((i, idx, arr) => arr.findIndex(x => x.name === i.name && x.brand === i.brand) === idx)
    .filter(i => (seen.has(i.category) && seen.size < cats.length ? false : (seen.add(i.category), true)))
    .slice(0, limit)
    .map(slim);
}

function buildSystem(ctx) {
  const w = ctx.weather;
  return [
    'You are Atelier, a warm, concise, high-taste fashion stylist inside a shopping and wardrobe app.',
    'Reply in 2 to 5 short sentences. Give concrete styling direction (silhouette, fabric, colour, layering).',
    'Do not invent product names, brands or prices: the app attaches real catalogue pieces under your reply.',
    `Customer style DNA: ${ctx.dna.archetype}; palette ${ctx.dna.palette}; silhouette ${ctx.dna.silhouette}; budget tier ${ctx.dna.budgetTier}.`,
    ctx.city ? `Location: ${ctx.city}${w ? `, currently ${w.tempC}°C and ${String(w.summary).toLowerCase()}` : ''}.` : '',
    `Preferred currency: ${ctx.currency}.`,
    ctx.saved.length ? `Pieces already in their wardrobe: ${ctx.saved.slice(0, 8).join('; ')}.` : 'Their wardrobe is empty so far.',
  ].filter(Boolean).join('\n');
}

const OCCASIONS = [
  [/wedding|nikah|shaadi|mehndi|walima/i, 'For a wedding, go tonal and tailored: one statement piece (embroidered or silk), quiet accessories and polished footwear.'],
  [/interview|office|work|meeting|boardroom|business/i, 'For work, keep the lines clean: a structured layer, a crisp shirt or fine knit and leather shoes. Let one texture lead.'],
  [/date|dinner|evening|party|night/i, 'For an evening out, pick one confident piece (a slip dress or sharp blazer) and keep everything else minimal and dark.'],
  [/beach|vacation|holiday|travel|trip|airport/i, 'For travel, build around breathable layers in two or three shades that all mix, plus one comfortable, good-looking shoe.'],
  [/gym|run|workout|sport/i, 'For training, choose technical fabrics in a restrained palette so the set also works as off-duty wear.'],
  [/today|weather|wear now|cold|hot|rain|outside/i, ''],
];

export function localReply(message, ctx) {
  const t = message.toLowerCase();
  const w = ctx.weather;
  if (/^(hi|hello|hey|salam|assalam)/.test(t.trim())) {
    return `Hello! I'm your Atelier stylist. Give me an occasion, a mood or a budget and I'll pull real pieces for it.${w ? ` It's ${w.tempC}°C in ${ctx.city} right now, so we'll dress for that.` : ''}`;
  }
  if (/wardrobe|capsule|what do i have|my pieces/.test(t)) {
    return ctx.saved.length
      ? `You currently have ${ctx.saved.length} pieces saved, starting with ${ctx.saved.slice(0, 3).join(', ')}. Open the Wardrobe page to mix them and see a coherence score.`
      : 'Your wardrobe is empty so far. Save a few pieces from the catalogue and I can help you combine them.';
  }
  const lines = [];
  const occ = OCCASIONS.find(([re]) => re.test(t));
  if (occ && occ[1]) lines.push(occ[1]);
  if (w) lines.push(`In ${ctx.city} it is ${w.tempC}°C (${String(w.summary).toLowerCase()}). ${w.advice}`);
  lines.push(`I'm keeping it ${ctx.dna.archetype.toLowerCase()}, around ${ctx.dna.palette}.`);
  lines.push('Here are live pieces from the catalogue that fit:');
  return lines.join(' ');
}

export async function stylistReply({ message, history, ctx }) {
  const system = buildSystem(ctx);
  const msgs = [...history.slice(-8).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: message }];
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();

  try {
    if (env('ANTHROPIC_API_KEY')) {
      const d = await fetchJson('https://api.anthropic.com/v1/messages', {
        method: 'POST', timeout: 25_000,
        headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'), max_tokens: 400, system, messages: msgs }),
      });
      const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      if (text) return { reply: text, source: 'Claude' };
    }
    if (env('OPENAI_API_KEY')) {
      const d = await fetchJson('https://api.openai.com/v1/chat/completions', {
        method: 'POST', timeout: 25_000,
        headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: env('OPENAI_MODEL', 'gpt-4o-mini'), max_tokens: 400, messages: [{ role: 'system', content: system }, ...msgs] }),
      });
      const text = d.choices?.[0]?.message?.content?.trim();
      if (text) return { reply: text, source: 'OpenAI' };
    }
  } catch (e) { console.warn('[ai] falling back to built-in stylist:', e.message); }

  return { reply: localReply(message, ctx), source: 'Atelier stylist' };
}
