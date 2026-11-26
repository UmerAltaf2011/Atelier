import { BRANDS } from './brands.js';
import { CURATED } from './pieces.js';

// Fills EVERY brand in the directory with a full range of pieces (target per brand below),
// so no brand shows just one item. Names are typical of each segment, prices are tier-scaled
// USD estimates, and everything is flagged illustrative until a real retail feed is plugged in.
const TARGET = { Luxury: 12, Contemporary: 10, 'High Street': 10, 'Sport & Street': 10, Pakistan: 12, 'South Asia': 10, Retailer: 12 };
const MULT = { Luxury: 14, Contemporary: 4, 'High Street': 1, 'Sport & Street': 2.2, Pakistan: 1, 'South Asia': 1.2, Retailer: 2.6 };

// name | category | gender | base USD | archetypes
const GLOBAL = `
Cotton Crew Tee|Tops|u|14|casual,minimalism
Oversized Graphic Hoodie|Tops|u|32|streetwear,athleisure
Fine-Knit Merino Sweater|Tops|u|38|old-money,quiet-luxury,minimalism
Oxford Button-Down Shirt|Tops|m|26|business-casual,preppy
Silk Blouse|Tops|w|34|business-casual,quiet-luxury
Ribbed Baby Tee|Tops|w|12|y2k,casual
Straight-Leg Denim Jeans|Bottoms|u|34|casual,grunge
Pleated Wool Trousers|Bottoms|u|42|old-money,business-casual
Cargo Utility Pants|Bottoms|u|36|streetwear,gorpcore
Pleated Mini Skirt|Bottoms|w|24|preppy,y2k
Satin Midi Skirt|Bottoms|w|30|minimalism,old-money
Floral Wrap Dress|Dresses|w|40|floral,boho
Slip Dress|Dresses|w|36|minimalism,quiet-luxury
Linen Shirt Dress|Dresses|w|38|boho,casual
Tailored Wool Blazer|Outerwear|u|58|business-casual,old-money
Trench Coat|Outerwear|u|70|old-money,quiet-luxury
Leather Biker Jacket|Outerwear|u|90|starboy,grunge
Technical Shell Jacket|Outerwear|u|66|gorpcore,streetwear
Wool Overcoat|Outerwear|u|84|dark-academia,old-money
Leather Penny Loafers|Shoes|u|60|old-money,preppy
Chunky Leather Sneakers|Shoes|u|55|streetwear,casual
Chelsea Boots|Shoes|u|64|starboy,dark-academia
Ballet Flats|Shoes|w|40|minimalism,preppy
Structured Leather Tote|Bags|u|70|business-casual,quiet-luxury
Mini Crossbody Bag|Bags|w|50|y2k,casual
Canvas Weekender|Bags|u|44|preppy,boho
Silk Printed Scarf|Accessories|u|22|old-money,boho
Leather Belt|Accessories|u|20|business-casual,old-money
Wool Beanie & Scarf Set|Accessories|u|18|casual,dark-academia
Star-Frame Sunglasses|Eyewear|u|28|starboy,y2k
Classic Acetate Sunglasses|Eyewear|u|26|old-money,minimalism
Minimal Steel Watch|Watches|u|60|minimalism,business-casual
Gold Chain Necklace|Jewellery|u|30|starboy,y2k
Pearl Stud Earrings|Jewellery|w|22|old-money,quiet-luxury
`;
const DESI = `
Embroidered Lawn 3-Piece|Dresses|w|34|desi-classic,floral
Digital Print Lawn Suit|Dresses|w|28|desi-classic,floral
Chiffon Formal Suit|Dresses|w|120|desi-festive,floral
Net Embroidered Bridal Lehnga|Dresses|w|420|desi-festive
Khaddar Winter 2-Piece|Dresses|w|36|desi-classic
Cotton Co-ord Set|Dresses|w|40|casual,minimalism
Straight Kurta|Tops|w|18|desi-classic,casual
Men's Cotton Kurta|Tops|m|26|desi-classic,old-money
Men's Shalwar Kameez|Dresses|m|32|desi-classic
Waistcoat|Outerwear|m|58|desi-festive,business-casual
Sherwani Set|Outerwear|m|240|desi-festive
Pashmina Shawl|Outerwear|u|34|desi-classic,old-money
Cigarette Trousers|Bottoms|w|16|desi-classic,minimalism
Silk Dupatta|Accessories|w|24|desi-festive
Peshawari Chappal|Shoes|m|40|desi-classic,retro-vintage
Embellished Khussa|Shoes|w|32|desi-festive,desi-classic
Embroidered Clutch|Bags|w|28|desi-festive
Jhumka Earrings|Jewellery|w|20|desi-festive,boho
`;
const parse = raw => raw.trim().split('\n').map(l => {
  const [name, category, gender, base, arch] = l.split('|');
  return { name, category, gender, base: Number(base), archetypes: arch.split(',') };
});
const G = parse(GLOBAL), D = parse(DESI);

const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const nice = n => (n < 40 ? Math.round(n) : n < 400 ? Math.round(n / 5) * 5 : Math.round(n / 10) * 10);

export function generatedPieces() {
  const have = new Map();
  for (const p of CURATED) have.set(p.brand, (have.get(p.brand) || 0) + 1);
  const out = [];
  for (const b of BRANDS) {
    const target = TARGET[b.tier] || 10, owned = have.get(b.name) || 0;
    if (owned >= target) continue;
    const desi = b.country === 'PK' || (b.tier === 'South Asia' && ['IN', 'BD', 'LK'].includes(b.country));
    const pool = desi ? [...D, ...G.filter(p => ['Bottoms', 'Outerwear', 'Shoes'].includes(p.category)).slice(0, 4)] : G;
    // deterministic shuffle by brand name, then take items covering many categories first
    const order = pool.map((p, i) => [hash(b.name + i), p]).sort((a, c) => a[0] - c[0]).map(x => x[1]);
    const seenCat = new Map();
    const picked = order.sort((a, c) => (seenCat.get(a.category) ?? 0) - (seenCat.get(c.category) ?? 0) || 0)
      .filter(p => { const n = seenCat.get(p.category) || 0; seenCat.set(p.category, n + 1); return n < 3; })
      .slice(0, target - owned);
    for (const p of picked) {
      const jitter = 0.85 + (hash(b.name + p.name) % 30) / 100;
      out.push({ brand: b.name, name: p.name, category: p.category, gender: p.gender, priceUsd: Math.max(8, nice(p.base * (MULT[b.tier] || 1) * jitter)), archetypes: p.archetypes });
    }
  }
  return out;
}
