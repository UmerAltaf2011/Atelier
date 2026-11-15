import { memo } from '../lib/cache.js';
import { BRANDS, findBrand } from '../data/brands.js';
import { fetchDummyJson } from './dummyjson.js';
import { fetchFakeStore } from './fakestore.js';

// ─── Add real retail feeds here ────────────────────────────────────────────
// No free public API covers "every brand in the world". Real brand catalogues
// come from affiliate networks (Awin, Rakuten, CJ, Impact, ShopStyle) or brand
// partnerships. Write one `fetchX()` that returns items in the shape below and
// add it to PROVIDERS; the rest of the app picks it up automatically.
//   { id, source, name, brand, category, gender, priceUsd, rating, image, images, description, tags }
const PROVIDERS = [fetchDummyJson, fetchFakeStore];

// Used only when every live provider is unreachable (no images: the UI draws art).
const SEED = [
  ['Structured Suede Field Jacket', 'Lemaire', 'Outerwear', 'men', 1190, 4.9],
  ['Pleated Wool Trousers', 'Toteme', 'Tops', 'women', 540, 4.7],
  ['Oxford Cotton Shirt', 'A.P.C.', 'Tops', 'men', 195, 4.6],
  ['Leather Penny Loafers', 'Gucci', 'Shoes', 'men', 890, 4.8],
  ['Silk Slip Dress', 'Reformation', 'Dresses', 'women', 320, 4.5],
  ['Everyday Leather Tote', 'Coach', 'Bags', 'women', 450, 4.7],
  ['Steel Field Watch', 'Longines', 'Watches', 'men', 1100, 4.8],
  ['Acetate Round Sunglasses', 'Ray-Ban', 'Eyewear', 'unisex', 165, 4.4],
].map(([name, brand, category, gender, priceUsd, rating], i) => ({
  id: `seed_${i + 1}`, source: 'Offline seed', name, brand, category, gender,
  priceUsd, rating, image: null, images: [], description: '', tags: [],
}));

const tierFromPrice = p => (p >= 300 ? 'Luxury' : p >= 90 ? 'Contemporary' : 'High Street');

function enrich(item) {
  const brand = findBrand(item.brand);
  return {
    ...item,
    brand: item.brand || 'Independent Label',
    tier: brand?.tier || tierFromPrice(item.priceUsd),
    brandDomain: brand?.domain || null,
    country: brand?.country || null,
  };
}

export const getAllProducts = () =>
  memo('catalogue', 30 * 60_000, async () => {
    const results = await Promise.allSettled(PROVIDERS.map(fn => fn()));
    const merged = new Map();
    for (const r of results) {
      if (r.status === 'fulfilled') for (const item of r.value) merged.set(item.id, enrich(item));
      else console.warn('[catalogue] provider failed:', r.reason?.message);
    }
    if (!merged.size) return { items: SEED.map(enrich), live: false };
    return { items: [...merged.values()], live: true };
  });

export async function brandDirectory() {
  const { items } = await getAllProducts();
  const counts = new Map();
  for (const it of items) counts.set(it.brand, (counts.get(it.brand) || 0) + 1);
  return BRANDS.map(b => ({ ...b, products: counts.get(b.name) || 0 }));
}

const SORTS = {
  'price-asc': (a, b) => a.priceUsd - b.priceUsd,
  'price-desc': (a, b) => b.priceUsd - a.priceUsd,
  rating: (a, b) => b.rating - a.rating,
};

export async function queryProducts(params) {
  const { items, live } = await getAllProducts();
  const q = (params.q || '').toLowerCase().trim();
  const maxUsd = Number(params.maxUsd) || Infinity;
  const brandQ = (params.brand || '').toLowerCase();

  let list = items.filter(it =>
    (!params.category || params.category === 'All' || it.category === params.category) &&
    (!params.gender || params.gender === 'All' || it.gender === params.gender || it.gender === 'unisex') &&
    (!params.tier || params.tier === 'All' || it.tier === params.tier) &&
    (!brandQ || it.brand.toLowerCase() === brandQ) &&
    it.priceUsd <= maxUsd &&
    (!q || `${it.name} ${it.brand} ${it.category} ${it.description} ${it.tags.join(' ')}`.toLowerCase().includes(q)));

  if (SORTS[params.sort]) list = [...list].sort(SORTS[params.sort]);
  else list = [...list].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));

  const limit = Math.min(Math.max(Number(params.limit) || 24, 1), 60);
  const page = Math.max(Number(params.page) || 1, 1);
  const count = (key) => {
    const m = new Map();
    for (const it of items) m.set(it[key], (m.get(it[key]) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
  };

  return {
    live,
    total: list.length,
    page,
    pages: Math.max(1, Math.ceil(list.length / limit)),
    items: list.slice((page - 1) * limit, page * limit),
    facets: {
      categories: count('category'),
      brands: count('brand').slice(0, 80),
      tiers: count('tier'),
      maxPriceUsd: Math.ceil(Math.max(...items.map(i => i.priceUsd), 100)),
    },
  };
}
