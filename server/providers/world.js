// Rates, geolocation and weather — all free, key-less public APIs, cached.
import { memo } from '../lib/cache.js';
import { fetchJson } from '../lib/http.js';
import { env } from '../lib/env.js';

const FALLBACK_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 153, AED: 3.67, PKR: 278, INR: 83.5, CAD: 1.37, AUD: 1.5,
  CHF: 0.88, CNY: 7.2, SAR: 3.75, TRY: 32, KRW: 1350, SGD: 1.34, MXN: 17, BRL: 5.1, ZAR: 18.5,
  NZD: 1.64, SEK: 10.6, NOK: 10.8, DKK: 6.9, HKD: 7.8, THB: 36, MYR: 4.7, IDR: 16000, EGP: 48,
  QAR: 3.64, KWD: 0.31, BDT: 117, NGN: 1500, PLN: 4,
};

export const getRates = () =>
  memo('rates', 60 * 60_000, async () => {
    const d = await fetchJson(env('RATES_URL', 'https://open.er-api.com/v6/latest/USD'));
    if (!d.rates) throw new Error('malformed rates payload');
    return { base: 'USD', rates: d.rates, updated: d.time_last_update_utc || null, live: true };
  }).catch(() => ({ base: 'USD', rates: FALLBACK_RATES, updated: null, live: false }));

const FALLBACK_CURRENCY = {
  US: 'USD', GB: 'GBP', PK: 'PKR', IN: 'INR', AE: 'AED', SA: 'SAR', CA: 'CAD', AU: 'AUD', JP: 'JPY',
  CN: 'CNY', KR: 'KRW', SG: 'SGD', CH: 'CHF', TR: 'TRY', MX: 'MXN', BR: 'BRL', ZA: 'ZAR', NZ: 'NZD',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', HK: 'HKD', TH: 'THB', MY: 'MYR', ID: 'IDR', EG: 'EGP', QA: 'QAR',
  KW: 'KWD', BD: 'BDT', NG: 'NGN', PL: 'PLN',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', PT: 'EUR', IE: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
};

export const currencyForCountry = code =>
  memo(`cur:${code}`, 24 * 3600_000, async () => {
    const d = await fetchJson(`${env('COUNTRIES_BASE', 'https://restcountries.com')}/v3.1/alpha/${code}?fields=currencies`);
    const first = Object.keys((Array.isArray(d) ? d[0] : d).currencies || {})[0];
    if (!first) throw new Error('no currency');
    return first;
  }).catch(() => FALLBACK_CURRENCY[code] || 'USD');

export async function reverseGeocode(lat, lon) {
  const d = await fetchJson(
    `${env('REVERSE_GEO_BASE', 'https://api.bigdatacloud.net')}/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  const countryCode = d.countryCode || '';
  return {
    lat: Number(lat), lon: Number(lon),
    city: d.city || d.locality || d.principalSubdivision || 'Your location',
    region: d.principalSubdivision || '',
    country: d.countryName || '',
    countryCode,
    currency: countryCode ? await currencyForCountry(countryCode) : 'USD',
  };
}

export async function ipLocation(ip) {
  const d = await fetchJson(`${env('IPGEO_BASE', 'https://ipwho.is')}/${ip || ''}`);
  if (d.success === false) throw new Error(d.message || 'ip lookup failed');
  return {
    lat: d.latitude, lon: d.longitude,
    city: d.city || 'Your area', region: d.region || '',
    country: d.country || '', countryCode: d.country_code || '',
    currency: d.currency?.code || (await currencyForCountry(d.country_code || '')),
    approximate: true,
  };
}

export async function searchPlaces(name) {
  const d = await fetchJson(
    `${env('GEOCODING_BASE', 'https://geocoding-api.open-meteo.com')}/v1/search?name=${encodeURIComponent(name)}&count=6&language=en`,
  );
  return Promise.all((d.results || []).map(async r => ({
    lat: r.latitude, lon: r.longitude, city: r.name, region: r.admin1 || '',
    country: r.country || '', countryCode: r.country_code || '',
    currency: r.country_code ? await currencyForCountry(r.country_code) : 'USD',
  })));
}

const WMO = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export function layerAdvice(temp, code) {
  const wet = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
  let advice = 'Mid-weight layers: a light jacket over a merino or cotton knit.';
  if (temp <= 5) advice = 'Cold: wool or shearling outerwear, a heavy knit and closed leather footwear.';
  else if (temp <= 14) advice = 'Cool: structured outerwear (suede, wool or leather) over a fine-gauge knit.';
  else if (temp >= 30) advice = 'Hot: open-weave linen, breathable poplin and light, airy footwear.';
  else if (temp >= 23) advice = 'Warm: linen or cotton, one light layer for the evening.';
  return wet ? `${advice} Rain expected: favour water-resistant outer layers.` : advice;
}

export const getWeather = (lat, lon) =>
  memo(`wx:${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`, 10 * 60_000, async () => {
    const d = await fetchJson(
      `${env('WEATHER_BASE', 'https://api.open-meteo.com')}/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5',
    );
    const c = d.current, tempC = Math.round(c.temperature_2m);
    return {
      live: true, tempC, feelsC: Math.round(c.apparent_temperature),
      code: c.weather_code, summary: WMO[c.weather_code] || 'Fair', isDay: !!c.is_day,
      windKph: Math.round(c.wind_speed_10m), advice: layerAdvice(tempC, c.weather_code),
      forecast: (d.daily?.time || []).map((date, i) => ({
        date, max: Math.round(d.daily.temperature_2m_max[i]), min: Math.round(d.daily.temperature_2m_min[i]),
        rain: d.daily.precipitation_probability_max?.[i] ?? 0,
      })),
    };
  });
