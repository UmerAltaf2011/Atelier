import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApiData } from '../lib/hooks.js';
import { PageHero, ScrollWords } from '../components/street.jsx';
import useTitle from '../lib/useTitle.js';
import { Reveal } from '../components/motion.jsx';

export default function About() {
  useTitle('How it works — Atelier');
  const health = useApiData('/health');
  const stats = useApiData('/stats');
  const h = health.data, s = stats.data;

  const sources = [
    ['Product feeds', 'DummyJSON + FakeStore', s ? (s.catalogueLive ? `${s.products.toLocaleString()} live pieces` : 'Offline sample') : '…', s?.catalogueLive],
    ['Exchange rates', 'open.er-api.com', s ? `${s.currencies} currencies · ${s.ratesLive ? 'live' : 'cached'}` : '…', s?.ratesLive],
    ['Location', 'Browser GPS · ipwho.is · BigDataCloud · Open-Meteo geocoding', 'Precise, approximate, or search any city', true],
    ['Weather', 'Open-Meteo', 'Live, refreshed every 15 minutes', true],
    ['AI stylist', h ? h.ai : '…', h?.ai === 'Built-in stylist' ? 'Add an API key for a full language model' : 'Powered by a live model', !!h],
    ['Photography', 'Live catalogue images', h?.photos ? 'Pexels editorial photography enabled' : 'Add a Pexels key for editorial photos', true],
  ];

  return (
    <>
      <PageHero variant="manual" kicker="Under the hood" lines={[['THE', ''], ['MANUAL.', 'tag']]}
        sub={<p className="lead">Atelier is a React front end with its own Node backend. Nothing here is a screenshot: products, prices, weather and location are fetched live and saved to your account.</p>} />
      <section className="section manifesto small"><ScrollWords text="No gatekeeping. No luxury tax. Real data, real weather, _your_ currency, and a stylist that remembers what you like." /></section>

      <section className="section tight">
        <Reveal className="section-head"><h2 className="h2">Where the data <em>comes from.</em></h2></Reveal>
        <div className="source-list">
          {sources.map(([name, src, note, ok], i) => (
            <Reveal key={name} className="source" delay={i * 0.05} y={18}>
              <i className={ok ? 'ok' : 'off'}></i>
              <div><h4>{name}</h4><p>{src}</p></div>
              <span>{note}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section tight">
        <div className="two-col">
          <Reveal>
            <div className="eyebrow">Honest note</div>
            <h2 className="h2">“Every brand in the world” <em>takes partners.</em></h2>
            <p className="body-copy">No free public API exposes every brand's catalogue. Real, complete brand feeds come from retail affiliate networks (Awin, Rakuten, CJ, Impact, ShopStyle) or direct partnerships. Atelier ships with free feeds so it works today, a 125-brand global directory with live logos and links, and a one-file adapter where you add real feeds.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="eyebrow">Your data</div>
            <h2 className="h2">Saved <em>automatically.</em></h2>
            <p className="body-copy">Every visitor gets an account on arrival. Saved pieces, Style DNA, looks, currency, location and chat history are stored on the server a moment after you change them. Create an account to open the same wardrobe on any device. You can export or delete everything from the Account page.</p>
            <Link to="/account" className="link-arrow">Open account <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
