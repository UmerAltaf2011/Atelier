import { fetchJson } from '../lib/http.js';
import { env } from '../lib/env.js';

// category slug -> [our category, gender]
const CATS = {
  'mens-shirts': ['Tops', 'men'],
  tops: ['Tops', 'women'],
  'womens-dresses': ['Dresses', 'women'],
  'mens-shoes': ['Shoes', 'men'],
  'womens-shoes': ['Shoes', 'women'],
  'womens-bags': ['Bags', 'women'],
  'mens-watches': ['Watches', 'men'],
  'womens-watches': ['Watches', 'women'],
  'womens-jewellery': ['Jewellery', 'women'],
  sunglasses: ['Eyewear', 'unisex'],
};

export const refineCategory = (title, category) =>
  category === 'Tops' && /jacket|coat|parka|blazer|bomber|puffer|cardigan/i.test(title) ? 'Outerwear' : category;

function normalize(p, category, gender) {
  const images = (p.images || []).filter(Boolean);
  return {
    id: `dj_${p.id}`,
    source: 'DummyJSON',
    name: p.title,
    brand: p.brand || '',
    category: refineCategory(p.title, category),
    gender,
    priceUsd: Number(p.price) || 0,
    rating: Number(p.rating) || 4,
    image: p.thumbnail || images[0] || null,
    images: images.slice(0, 5),
    description: p.description || '',
    tags: p.tags || [],
  };
}

export async function fetchDummyJson() {
  const base = env('DUMMYJSON_BASE', 'https://dummyjson.com');
  const out = [];
  await Promise.all(Object.entries(CATS).map(async ([slug, [category, gender]]) => {
    try {
      const data = await fetchJson(`${base}/products/category/${slug}?limit=60`);
      for (const p of data.products || []) out.push(normalize(p, category, gender));
    } catch (e) { console.warn(`[dummyjson] ${slug}: ${e.message}`); }
  }));
  return out;
}
