import { useEffect, useState } from 'react';
import { api } from './api.js';

export function useApiData(path) {
  const [s, setS] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let off = false;
    setS(x => ({ ...x, loading: true }));
    api(path)
      .then(data => !off && setS({ data, loading: false, error: null }))
      .catch(error => !off && setS({ data: null, loading: false, error }));
    return () => { off = true; };
  }, [path]);
  return s;
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
