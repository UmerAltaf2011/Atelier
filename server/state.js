// Validates and merges client state so only known, size-limited fields are stored.
const str = (v, n = 80) => (typeof v === 'string' ? v.slice(0, n) : '');

function cleanItem(i) {
  if (!i || typeof i !== 'object') return null;
  const id = str(i.id, 40);
  if (!id) return null;
  return {
    id, name: str(i.name, 140), brand: str(i.brand, 60), category: str(i.category, 30), gender: str(i.gender, 10),
    priceUsd: Number(i.priceUsd) || 0, rating: Number(i.rating) || 0, tier: str(i.tier, 30),
    image: typeof i.image === 'string' && /^https?:/.test(i.image) ? i.image.slice(0, 400) : null,
    brandDomain: str(i.brandDomain, 80) || null,
  };
}

export function mergeState(current, body) {
  const s = { ...current };
  if (body.dna && typeof body.dna === 'object') {
    const d = body.dna;
    s.dna = {
      archetypeId: str(d.archetypeId, 30) || s.dna.archetypeId || '',
      archetype: str(d.archetype, 60) || s.dna.archetype,
      runnerUpId: str(d.runnerUpId, 30) || s.dna.runnerUpId || '',
      palette: str(d.palette, 80) || s.dna.palette,
      swatches: Array.isArray(d.swatches) ? d.swatches.slice(0, 6).map(c => str(c, 9)) : s.dna.swatches,
      silhouette: str(d.silhouette, 60) || s.dna.silhouette,
      occasion: str(d.occasion, 40) || s.dna.occasion,
      budgetTier: str(d.budgetTier, 60) || s.dna.budgetTier,
      completed: !!d.completed,
    };
  }
  if (Array.isArray(body.saved)) s.saved = body.saved.slice(0, 300).map(cleanItem).filter(Boolean);
  if (Array.isArray(body.outfits)) {
    s.outfits = body.outfits.slice(0, 50).map(o => ({
      id: str(o.id, 40), name: str(o.name, 60),
      ids: Array.isArray(o.ids) ? o.ids.slice(0, 8).map(x => str(x, 40)) : [],
      coherence: Number(o.coherence) || 0, createdAt: Number(o.createdAt) || Date.now(),
    }));
  }
  if (typeof body.currency === 'string' && /^[A-Z]{3}$/.test(body.currency)) s.currency = body.currency;
  if (typeof body.currencyAuto === 'boolean') s.currencyAuto = body.currencyAuto;
  if (body.location === null) s.location = null;
  else if (body.location && typeof body.location === 'object') {
    const l = body.location;
    if (Number.isFinite(Number(l.lat)) && Number.isFinite(Number(l.lon))) {
      s.location = {
        lat: Number(l.lat), lon: Number(l.lon), city: str(l.city, 60), region: str(l.region, 60),
        country: str(l.country, 60), countryCode: str(l.countryCode, 3), approximate: !!l.approximate,
      };
    }
  }
  if (body.prefs && typeof body.prefs === 'object') s.prefs = { ...s.prefs, liveLocation: !!body.prefs.liveLocation };
  return s;
}
