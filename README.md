# Atelier — playful, full-stack edition

React front end + a dependency-free Node backend.

- **Live catalogue** from real product APIs, with a global 125-brand directory (logos load live from each brand's own site)
- **Live FX** for ~160 currencies, auto-selected from your location
- **Live location**: precise GPS, IP fallback, any-city search, optional live sync while travelling
- **Live weather** (Open-Meteo) feeding the stylist and the wardrobe
- **AI stylist chatbot** (Claude / OpenAI if you add a key, built-in stylist otherwise), history saved per user
- **Auto-saving accounts**: every visitor gets an account automatically; wardrobe, Style DNA, looks, currency, location and chat are saved to the server a moment after every change. Register to use it on any device. Export / delete from the Account page.
- **Animations**: cinematic scrolling photo columns, split-text headline, magnetic buttons, 3D-tilt cards, scroll-linked timeline, count-ups, marquees, page transitions, spring drawers. Respects "reduce motion".

## What's new in this version

- **3D mannequin** (`src/components/Mannequin3D.jsx`, three.js): re-dresses itself for every style archetype. Drag to spin. It appears in the Home "Vibe studio" and on your quiz result. No model files to download.
- **18 style archetypes** (`server/data/archetypes.js`): Easy Casual, Business Casual, Floral Romantic, Old Money, Minimalist, Starboy, Streetwear, Quiet Luxury, Preppy, Boho, Athleisure, Y2K Pop, Dark Academia, Grunge, Desi Classic, Desi Festive, Gorpcore, Retro Vintage. Add one by adding an entry there.
- **Quiz that never repeats** (`server/quiz.js`): 6 questions per run. With an AI key, each question is generated fresh from your earlier answers. Without one, a shuffled 14-question bank is used and the questions you've already seen are skipped next time. The stylist chat also ends each reply with a different follow-up question.
- **Pakistani brands**: 55 Pakistani labels (Khaadi, Gul Ahmed, Maria B., Sapphire, Junaid Jamshed, Outfitters, Limelight, Asim Jofa, HSY, Borjan, Stylo...) plus ~170 more global brands in the directory (228 total).
- **Curated catalogue** (`server/data/pieces.js`): 210 pieces across Pakistani and global brands, each tagged with archetypes. **These are illustrative:** names are typical of each brand's range but prices are rough estimates and there are no photos. They're marked "Curated" / "≈" in the app.
- **Email**: verification code on sign-up, password reset by code, and a "password changed" notice, via Resend or any SMTP server (see `.env.example`).
- **Playful theme**: new palette (aubergine, cream, hot pink, sun yellow, lime, sky, lilac), Fraunces headline font, springy buttons, draggable stickers.

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
| `RESEND_API_KEY` + `MAIL_FROM` | Real verification / reset emails through Resend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Real emails through any SMTP server (Gmail App Password works) |

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
`/api/editorial` · `/api/stats` · `/api/archetypes` · `POST /api/quiz/{next,finish}` · `POST /api/auth/{guest,register,login,verify,resend,forgot,reset}` · `GET/PUT/DELETE /api/me` ·
`GET /api/me/export` · `POST /api/chat` · `GET/DELETE /api/chat/history`

## Before putting it on the internet

- Host the Node server (Render, Railway, Fly.io, a VPS). Static-only hosts (Netlify/Vercel static) cannot run the backend.
- Serve over HTTPS, set a real `JWT_SECRET`, and restrict CORS in `server/index.js` to your domain.
- The JSON database is fine for a prototype and small traffic; move to Postgres/Mongo for real scale.
- Set NODE_ENV=production so one-time codes are never returned in API responses, and configure Resend or SMTP.
- Respect the terms of any API you add; never scrape brand sites without permission.

## v4 changes
- Soft pastel theme + Lusion-style motion (`src/soft.css`, `src/components/fx.jsx`): floating blobs, cursor follower, intro curtain, blur-in reveals, page transitions.
- Every brand now has 10-12 pieces (`server/data/generated.js`); illustrative until a retail feed is plugged in.
- Chattier stylist (`server/ai.js`), with or without an API key.
- 3D studio: studio lighting, shadows, face, physical skin/cloth; anime picks (Gojo, Naruto, Luffy, Tanjiro, Goku, Levi).
- For a photoreal rig, drop `public/models/<gojo|naruto|...|archetype-id>.glb`; it replaces the procedural figure automatically. Use only models you have rights to.

## v5 changes (street edition)
- Theme swapped from soft pastel to streetwear: concrete + traffic orange, hard shadows, tape, spray splats (`src/street.css`, replaces `soft.css`). Fonts: Anton, Archivo, Permanent Marker.
- Scroll components in `src/components/street.jsx`: `Tape` (marquee that speeds up with your scroll), `ScrollWords` (words light up as you scroll), `PinnedRow` (vertical scroll drives a horizontal track), `PageHero` (a different opening scene per page), `Shout` (word grows into view).
- Home: sticky 250vh hero scrubbed by scroll (grayscale to colour, words fly apart, stamp pops in), manifesto, pinned horizontal "Pick your lane" row, then the 3D studio, rack, brands, stats, stylist, closing shout.
- Page scenes: Shop = THE DROP (tapes), Brands = THE WALL (draggable tags), Wardrobe = YOUR RACK (swaying hangers), About = THE MANUAL (zine + scroll words), Account = ID card, Quiz = tape + restyled.
- Intro counter + route wipe transitions. Not built or run in this environment (no network): run `npm install && npm run dev` and tell me anything that looks off.

## v6 changes (soft + fire)
- Palette softened to peach, blush, butter and lavender with a warm plum for dark blocks (`src/fire.css`, loaded last; `street.css` was converted from hard black borders and offset shadows to soft glows and round corners). Fonts: Fredoka (headlines), Nunito (body), Caveat (handwritten bits).
- Fire: `Embers` canvas (embers rise, burst from your cursor, pour out faster when you scroll fast), `FireBar` flames (grow with scroll on the Home hero and the closing "step out", rise with the loading counter, burn along the footer), flame-gradient text with a heat-shimmer SVG filter, flickering buttons, fire wipe between pages.
- Everything respects "reduce motion". If it feels heavy on a slow device, lower the particle caps in `Embers` (src/components/fx.jsx).
- Not built or run here (no network): `npm install && npm run dev`.

## v8 changes
- Fire effects removed (embers, flame bars, burning text, heat shimmer, flickering buttons). The soft peach palette, rounded fonts and all scroll animations stay.
