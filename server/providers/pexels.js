// Optional: real editorial fashion photography (free key from pexels.com/api).
import { fetchJson } from '../lib/http.js';
import { env } from '../lib/env.js';

export async function fetchEditorial() {
  const key = env('PEXELS_API_KEY');
  if (!key) return [];
  const data = await fetchJson(
    'https://api.pexels.com/v1/search?query=fashion%20editorial%20street%20style&orientation=portrait&per_page=24',
    { headers: { Authorization: key } },
  );
  return (data.photos || []).map(p => ({
    src: p.src.portrait || p.src.large,
    alt: p.alt || 'Fashion editorial',
    credit: p.photographer,
    creditUrl: p.url,
    color: p.avg_color,
  }));
}
