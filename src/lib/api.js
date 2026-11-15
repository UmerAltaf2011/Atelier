let token = '';
try { token = localStorage.getItem('atelier_token') || ''; } catch { /* storage blocked */ }

export const getToken = () => token;
export function setToken(t) {
  token = t;
  try { t ? localStorage.setItem('atelier_token', t) : localStorage.removeItem('atelier_token'); } catch { /* ignore */ }
}

export async function api(path, { method = 'GET', body, keepalive, signal } = {}) {
  const res = await fetch(`/api${path}`, {
    method, keepalive, signal,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status });
  return data;
}

// Every visitor gets an account automatically (a "guest"), so data is saved from the first click.
let boot = null;
export function ensureSession() {
  boot ||= (async () => {
    let me = null;
    if (token) {
      try { me = await api('/me'); } catch (e) { if (e.status === 401) setToken(''); else throw e; }
    }
    if (!me) { me = await api('/auth/guest', { method: 'POST' }); setToken(me.token); }
    return me;
  })().catch(e => { boot = null; throw e; });
  return boot;
}
