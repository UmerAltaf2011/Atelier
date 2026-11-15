# Atelier — live, full-stack edition

React front end + a dependency-free Node backend.

- **Live catalogue** from real product APIs, with a global 125-brand directory (logos load live from each brand's own site)
- **Live FX** for ~160 currencies, auto-selected from your location
- **Live location**: precise GPS, IP fallback, any-city search, optional live sync while travelling
- **Live weather** (Open-Meteo) feeding the stylist and the wardrobe
- **AI stylist chatbot** (Claude / OpenAI if you add a key, built-in stylist otherwise), history saved per user
- **Auto-saving accounts**: every visitor gets an account automatically; wardrobe, Style DNA, looks, currency, location and chat are saved to the server a moment after every change. Register to use it on any device. Export / delete from the Account page.
- **Animations**: cinematic scrolling photo columns, split-text headline, magnetic buttons, 3D-tilt cards, scroll-linked timeline, count-ups, marquees, page transitions, spring drawers. Respects "reduce motion".

## Run it (Windows PowerShell)

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned   # once, if npm is blocked
npm install
npm run dev
```

`npm run dev` starts the API (http://localhost:8787) and the site (http://localhost:5173, opens automatically).
Needs Node 18+ and internet access (for the live data and fonts).

### Production

```powershell
npm run build
npm start        # serves the site AND the API on http://localhost:8787
```

## Optional keys (copy `.env.example` to `.env`)

| Variable | What it enables |
|---|---|
| `ANTHROPIC_API_KEY` | AI stylist answered by Claude (`ANTHROPIC_MODEL` to change the model) |
| `OPENAI_API_KEY` | AI stylist answered by OpenAI instead |
| `PEXELS_API_KEY` | Real editorial fashion photography in the hero (free at pexels.com/api) |
| `JWT_SECRET` | Fixed signing secret (auto-generated and stored if empty) |

Without keys everything still works: the stylist uses the built-in rules engine and the hero uses live catalogue photos.

## About "all brands in the world"

No free public API exposes every brand's catalogue. This project ships with two free product feeds
(DummyJSON, FakeStore) so it works today, plus the brand directory. Their prices and brand names are
**demo data**, not real retail prices. To get real, complete brand data, join a retail affiliate network
(Awin, Rakuten, CJ, Impact, ShopStyle) or partner with retailers, then add **one function** to
`server/providers/index.js` that returns items in the documented shape. Everything else (search, filters,
brand counts, stylist, wardrobe) picks it up automatically.

## Project map

```
server/
  index.js            all API routes + static hosting of the built site
  ai.js               stylist: Claude / OpenAI / built-in rules, product picking
  state.js            validates what the client may save
  data/brands.js      the 125-brand global directory
  providers/index.js  catalogue aggregation, filtering, tiers  <- add real feeds here
  providers/dummyjson.js, fakestore.js, pexels.js
  providers/world.js  FX rates, geolocation, city search, weather
  lib/db.js           JSON-file database (swap for Postgres/Mongo here)
  lib/auth.js         signed tokens + scrypt password hashing (no dependencies)
src/
  store.jsx           global state, auto-save, location/currency/weather logic
  pages/              Home, Shop, Brands, Wardrobe, Quiz, About, Account
  components/         Nav, ChatDrawer, ProductCard/Modal, CurrencyDialog, motion helpers
  styles.css          the whole design system
```

## API

`GET /api/catalogue` · `/api/brands` · `/api/rates` · `/api/weather` · `/api/geo/{ip,context,search}` ·
`/api/editorial` · `/api/stats` · `POST /api/auth/{guest,register,login}` · `GET/PUT/DELETE /api/me` ·
`GET /api/me/export` · `POST /api/chat` · `GET/DELETE /api/chat/history`

## Before putting it on the internet

- Host the Node server (Render, Railway, Fly.io, a VPS). Static-only hosts (Netlify/Vercel static) cannot run the backend.
- Serve over HTTPS, set a real `JWT_SECRET`, and restrict CORS in `server/index.js` to your domain.
- The JSON database is fine for a prototype and small traffic; move to Postgres/Mongo for real scale.
- Add email verification / password reset before relying on accounts.
- Respect the terms of any API you add; never scrape brand sites without permission.
