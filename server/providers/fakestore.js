import { fetchJson } from '../lib/http.js';
import { env } from '../lib/env.js';
import { refineCategory } from './dummyjson.js';

export async function fetchFakeStore() {
  const base = env('FAKESTORE_BASE', 'https://fakestoreapi.com');
  const list = await fetchJson(`${base}/products`);
  return list
    .filter(p => /clothing|jewel/i.test(p.category))
    .map(p => {
      const jewellery = /jewel/i.test(p.category);
      return {
        id: `fs_${p.id}`,
        source: 'FakeStore',
        name: p.title,
        brand: '',
        category: jewellery ? 'Jewellery' : refineCategory(p.title, 'Tops'),
        gender: jewellery ? 'unisex' : /women/i.test(p.category) ? 'women' : 'men',
        priceUsd: Number(p.price) || 0,
        rating: Number(p.rating?.rate) || 4,
        image: p.image || null,
        images: p.image ? [p.image] : [],
        description: p.description || '',
        tags: [],
      };
    });
}
