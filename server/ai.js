import { env } from './lib/env.js';
import { fetchJson } from './lib/http.js';
import { getAllProducts } from './providers/index.js';
import { ARCHETYPES, ARCH_BY_ID } from './data/archetypes.js';

export const aiProvider = () => (env('ANTHROPIC_API_KEY') ? 'Claude' : env('OPENAI_API_KEY') ? 'OpenAI' : 'Built-in stylist');

const CAT_RULES = [
  [/wedding|nikah|shaadi|mehndi|walima|barat|festive|eid|formal|party/i, 'Dresses'],
  [/office|interview|work|meeting|business|boardroom/i, 'Tops'],
  [/dress|gown|abaya|kurta|saree|sari|shalwar|lehnga|lawn|suit/i, 'Dresses'],
  [/trouser|pants|jeans|denim|skirt|cargo|jogger|legging|shorts/i, 'Bottoms'],
  [/shoe|sneaker|loafer|boot|heel|footwear|sandal/i, 'Shoes'],
  [/\bbags?\b|tote|clutch|handbag/i, 'Bags'],
  [/watch/i, 'Watches'],
  [/scarf|belt|\bcap\b|hat|accessor/i, 'Accessories'],
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

export const mentionedArchetype = text => {
  const t = text.toLowerCase();
  return ARCHETYPES.find(a => t.includes(a.name.toLowerCase()) || t.includes(a.id.replace(/-/g, ' '))) || null;
};

export async function pickProducts(text, { rate = 1, limit = 3, archetypeId = '', country = '' } = {}) {
  const { items } = await getAllProducts();
  const cats = wantedCategories(text);
  const budget = parseBudget(text, rate);
  const style = mentionedArchetype(text)?.id || archetypeId;
  const wantPk = /pakistan|desi|lawn|khaadi|sapphire|maria b|junaid|kurta|shalwar|khussa/i.test(text) || country === 'PK';
  const score = i => (style && (i.archetypes || []).includes(style) ? 2 : 0) + (wantPk && i.country === 'PK' ? 1.5 : 0) + i.rating / 10;
  const pool = items.filter(i => cats.includes(i.category) && (!budget || i.priceUsd <= budget)).sort((a, b) => score(b) - score(a));
  const seen = new Set();
  return (pool.length ? pool : [...items].sort((a, b) => b.rating - a.rating))
    .filter((i, idx, arr) => arr.findIndex(x => x.name === i.name && x.brand === i.brand) === idx)
    .filter(i => (seen.has(i.category) && seen.size < cats.length ? false : (seen.add(i.category), true)))
    .slice(0, limit)
    .map(slim);
}

const FOLLOW_UPS = [
  'What is the vibe you want people to get when you walk in?',
  'Is this for daytime or after dark?',
  'Do you lean dressed-up or dressed-down for this one?',
  'Which colour are you most likely to reach for right now?',
  'Do you want it comfy first or sharp first?',
  'Is there a piece you already own that this should work with?',
  'Would you rather wear one hero piece or a full coordinated look?',
  'Any fabric you love, or one you avoid?',
  'Who will you be around: friends, family, colleagues?',
  'Do you want to be noticed, or just feel great quietly?',
  'Are we dressing for heat, cold, or whatever the day throws at us?',
  'Prefer desi, western, or a mix of both today?',
  'Which brand do you secretly wish you could wear head to toe?',
  'Do you like it fitted, relaxed, or properly oversized?',
  'What was the last outfit that made you feel amazing?',
  'Shoes first or outfit first when you plan?',
];
const STYLE_FOLLOW_UPS = {
  'old-money': ['Camel and cream, or navy and racing green?', 'Loafers or a polished derby?'],
  starboy: ['Chrome or gold jewellery tonight?', 'Black leather or a sharp red piece?'],
  floral: ['Soft pastel petals or bold garden prints?', 'Midi, maxi or mini?'],
  streetwear: ['Hoodie weather, or tee and cargo?', 'Are we going chunky sneakers or clean court shoes?'],
  minimalism: ['Warm neutrals or cool greys?', 'How many pieces is your ideal capsule: five, ten, fifteen?'],
  'desi-festive': ['Is the event a mehndi, barat or walima?', 'Do you want zari and embroidery, or soft pastels?'],
  'desi-classic': ['Lawn, cotton or khaddar for the weather?', 'Plain kurta with a statement dupatta, or the other way round?'],
  'business-casual': ['Is it a client day or a desk day?', 'Blazer on, or sleeves rolled up?'],
};

// A follow-up the user has not recently been asked (checks the last 12 assistant messages).
export function pickFollowUp(history = [], archetypeId = '') {
  const recent = history.filter(m => m.role === 'assistant').slice(-12).map(m => m.content).join(' ');
  const pool = [...(STYLE_FOLLOW_UPS[archetypeId] || []), ...FOLLOW_UPS].filter(q => !recent.includes(q));
  const list = pool.length ? pool : FOLLOW_UPS;
  return list[Math.floor(Math.random() * list.length)];
}
const recentQuestions = history => history.filter(m => m.role === 'assistant')
  .flatMap(m => (m.content.match(/[^.!?\n]*\?/g) || []).map(x => x.trim())).slice(-10);

function buildSystem(ctx, history = []) {
  const w = ctx.weather;
  return [
    'You are Atelier, a chatty, warm, funny best-friend stylist inside a shopping and wardrobe app. You genuinely enjoy talking.',
    'Talk like a real person: react to what they just said first (excited, teasing, empathetic), chat about anything they bring up (mood, plans, anime, music, weather), then steer gently back to their look.',
    'Reply in 4 to 8 sentences, casual and playful, with the odd emoji. Give concrete styling direction (silhouette, fabric, colour, layering) and a small personal opinion ("honestly, I would...").',
    'If they mention an anime character or cosplay (Gojo Satoru, Naruto, Luffy, Tanjiro, Goku, Levi), get hyped and suggest real-world outfit pieces inspired by that look, and mention the 3D studio can show it.',
    'End with exactly ONE short, fresh follow-up question that helps you style them better. It must be different in topic and wording from every question you asked before.',
    recentQuestions(history).length ? `Questions you already asked (never repeat): ${JSON.stringify(recentQuestions(history))}` : '',
    'Do not invent product names, brands or prices: the app attaches real catalogue pieces under your reply.',
    `You know the Pakistani market (Khaadi, Sapphire, Maria B., Junaid Jamshed, Outfitters...) as well as global brands.`,
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

const pick = a => a[Math.floor(Math.random() * a.length)];
const ANIME_RE = /gojo|satoru|naruto|luffy|tanjiro|goku|levi|anime|cosplay|jujutsu/i;

export function localReply(message, ctx, history = []) {
  const t = message.toLowerCase().trim();
  const w = ctx.weather;
  const fu = pickFollowUp(history, ctx.dna.archetypeId);
  if (/^(hi|hello|hey|salam|assalam|yo|hola)\b/.test(t)) {
    return `${pick(['Heyyy!', 'Hello hello!', 'Salam! So good to see you.', 'Well hi there, stylish one!'])} I'm your Atelier stylist, and honestly I could talk outfits all day.${w ? ` It's ${w.tempC}°C in ${ctx.city} right now, so we'll dress for that.` : ''} Tell me an occasion, a mood or a budget and I'll pull pieces. ${fu}`;
  }
  if (/how are you|how r u|what's up|whats up|sup\b/.test(t)) return `Doing great, thanks for asking! I've been staring at colour palettes all day, which is basically my idea of heaven 😄 How's your day going, and do you need something to wear for it? ${fu}`;
  if (/thank|thanks|shukriya|thx/.test(t)) return `Aww, anytime! Helping you look good is the best part of my job. Want me to tweak the budget, try another colour, or build the whole outfit from head to toe? ${fu}`;
  if (/who are you|your name|are you (a )?(bot|ai|real)/.test(t)) return `I'm Atelier, your pocket stylist: part fashion nerd, part hype friend. I know a ton of Pakistani and global brands and I get to see your style DNA, so I can be annoyingly specific. ${fu}`;
  if (/joke|funny|bored/.test(t)) return `Okay: why did the scarf get promoted? It was always going places and knew how to wrap things up 🧣 Alright, my comedy career is over. Now, shall we shop? ${fu}`;
  if (/love|nice|great|awesome|cool|amazing/.test(t) && t.split(' ').length < 6) return `Right?! Your taste is genuinely good. Let's keep that energy going and build something with a bit more personality. ${fu}`;
  if (ANIME_RE.test(t)) {
    return `Oh, you're an anime person, I LOVE that. For Gojo, think a high-collar black jacket, slim black trousers, black sunglasses and clean white sneakers; for Naruto, orange and navy with a bold headband; for Luffy, a red vest, denim shorts and a straw hat. Open the Vibe studio on the home page to see them in 3D! ${fu}`;
  }
  if (/wardrobe|capsule|what do i have|my pieces/.test(t)) {
    return ctx.saved.length
      ? `You've got ${ctx.saved.length} pieces saved, starting with ${ctx.saved.slice(0, 3).join(', ')}. Nice start! Open the Wardrobe page to mix them and see a coherence score, and tell me what's missing. ${fu}`
      : `Your wardrobe is empty so far, which is a blank canvas, honestly my favourite thing. Heart a few pieces from the catalogue and I'll help you combine them. ${fu}`;
  }
  const lines = [pick(['Ooh, I like where this is going.', 'Great pick of a topic!', 'Okay, I have thoughts, and they are good ones.', 'Love it, let me style this properly.'])];
  const occ = OCCASIONS.find(([re]) => re.test(t));
  if (occ && occ[1]) lines.push(occ[1]);
  if (w) lines.push(`In ${ctx.city} it is ${w.tempC}°C (${String(w.summary).toLowerCase()}). ${w.advice}`);
  lines.push(`I'm keeping it ${ctx.dna.archetype.toLowerCase()}, around ${ctx.dna.palette}, because that suits you.`);
  lines.push(fu);
  lines.push('Here are a few picks while you think it over:');
  return lines.join(' ');
}

export async function stylistReply({ message, history, ctx }) {
  const system = buildSystem(ctx, history);
  const msgs = [...history.slice(-16).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: message }];
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();

  try {
    if (env('ANTHROPIC_API_KEY')) {
      const d = await fetchJson('https://api.anthropic.com/v1/messages', {
        method: 'POST', timeout: 25_000,
        headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'), max_tokens: 700, system, messages: msgs }),
      });
      const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      if (text) return { reply: text, source: 'Claude' };
    }
    if (env('OPENAI_API_KEY')) {
      const d = await fetchJson('https://api.openai.com/v1/chat/completions', {
        method: 'POST', timeout: 25_000,
        headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: env('OPENAI_MODEL', 'gpt-4o-mini'), max_tokens: 700, messages: [{ role: 'system', content: system }, ...msgs] }),
      });
      const text = d.choices?.[0]?.message?.content?.trim();
      if (text) return { reply: text, source: 'OpenAI' };
    }
  } catch (e) { console.warn('[ai] falling back to built-in stylist:', e.message); }

  return { reply: localReply(message, ctx, history), source: 'Atelier stylist' };
}
