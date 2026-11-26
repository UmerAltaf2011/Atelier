import { CURATED } from '../data/pieces.js';
import { generatedPieces } from '../data/generated.js';
import { ARCH_BY_ID } from '../data/archetypes.js';

// Deterministic 4.2–4.9 rating so results are stable between restarts.
const rate = s => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 4.2 + (h % 8) / 10;
};

export async function fetchCurated() {
  return [...CURATED, ...generatedPieces()].map((p, i) => {
    const styles = p.archetypes.map(a => ARCH_BY_ID[a]?.name).filter(Boolean);
    return {
      id: `cur_${i + 1}`,
      source: 'Atelier curated (illustrative)',
      name: p.name, brand: p.brand, category: p.category, gender: p.gender,
      priceUsd: p.priceUsd, rating: Number(rate(p.brand + p.name).toFixed(1)),
      image: null, images: [], illustrative: true,
      description: `${p.name} by ${p.brand}. Styles: ${styles.join(', ')}.`,
      tags: p.archetypes, archetypes: p.archetypes,
    };
  });
}
