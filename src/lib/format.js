export const flag = cc =>
  cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌐';

export const initials = n =>
  String(n || '').split(/[\s&.'’-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A';

let names = null;
try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch { /* unsupported */ }
export const currencyName = code => { try { return names?.of(code) || code; } catch { return code; } };

export function money(usd, code, rates) {
  const rate = rates?.[code];
  const cur = rate ? code : 'USD';
  const v = usd * (rate || 1);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: v >= 100 ? 0 : 2 }).format(v);
  } catch { return `${cur} ${Math.round(v)}`; }
}

export function hash(str) {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export const gradientFor = name => {
  const h = hash(name) % 360;
  return `linear-gradient(140deg, hsl(${h} 22% 17%), hsl(${(h + 45) % 360} 30% 33%))`;
};

export function matchScore(item, dna) {
  let s = 64 + (Math.min(5, Math.max(1, item.rating || 4)) - 3) * 7 + (hash(item.id) % 7);
  const tier = dna?.budgetTier || '';
  if (tier && (tier.includes(item.tier) || (item.tier === 'Sport & Street' && /street/i.test(tier)))) s += 7;
  return Math.max(60, Math.min(99, Math.round(s)));
}

export const brandUrl = item =>
  item.brandDomain ? `https://${item.brandDomain}` : `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${item.brand} ${item.name}`)}`;

export function haversineKm(a, b) {
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const slimItem = i => ({
  id: i.id, name: i.name, brand: i.brand, category: i.category, gender: i.gender, priceUsd: i.priceUsd,
  rating: i.rating, tier: i.tier, image: i.image, brandDomain: i.brandDomain,
});

export const timeAgo = ts => {
  if (!ts) return 'never';
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};
