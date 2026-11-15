// memo(key, ttl, fn): cache with in-flight de-duplication and
// "serve stale if the upstream API is down" behaviour.
const store = new Map();

export async function memo(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  if (hit?.pending) return hit.pending;

  const pending = (async () => {
    try {
      const value = await fn();
      store.set(key, { value, exp: Date.now() + ttlMs });
      return value;
    } catch (err) {
      if (hit && 'value' in hit) {
        store.set(key, { value: hit.value, exp: Date.now() + 30_000 });
        return hit.value;
      }
      store.delete(key);
      throw err;
    }
  })();
  store.set(key, { ...(hit || {}), pending });
  return pending;
}
