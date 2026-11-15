// Global brand directory: name | official domain | ISO country | tier.
// Logos are fetched live by the browser from each brand's own domain.
const RAW = `
Hermès|hermes.com|FR|Luxury
Louis Vuitton|louisvuitton.com|FR|Luxury
Chanel|chanel.com|FR|Luxury
Dior|dior.com|FR|Luxury
Gucci|gucci.com|IT|Luxury
Prada|prada.com|IT|Luxury
Saint Laurent|ysl.com|FR|Luxury
Bottega Veneta|bottegaveneta.com|IT|Luxury
Celine|celine.com|FR|Luxury
Loewe|loewe.com|ES|Luxury
Burberry|burberry.com|GB|Luxury
Balenciaga|balenciaga.com|ES|Luxury
Givenchy|givenchy.com|FR|Luxury
Valentino|valentino.com|IT|Luxury
Fendi|fendi.com|IT|Luxury
Versace|versace.com|IT|Luxury
Cartier|cartier.com|FR|Luxury
Rolex|rolex.com|CH|Luxury
Tom Ford|tomford.com|US|Luxury
Brunello Cucinelli|brunellocucinelli.com|IT|Luxury
Loro Piana|loropiana.com|IT|Luxury
Maison Margiela|maisonmargiela.com|FR|Luxury
Jil Sander|jilsander.com|DE|Luxury
Alexander McQueen|alexandermcqueen.com|GB|Luxury
Moncler|moncler.com|IT|Luxury
Ralph Lauren|ralphlauren.com|US|Luxury
Armani|armani.com|IT|Luxury
Dolce & Gabbana|dolcegabbana.com|IT|Luxury
Miu Miu|miumiu.com|IT|Luxury
Tiffany & Co.|tiffany.com|US|Luxury
Lemaire|lemaire.fr|FR|Contemporary
A.P.C.|apc.fr|FR|Contemporary
Toteme|toteme.com|SE|Contemporary
Ami Paris|amiparis.com|FR|Contemporary
Acne Studios|acnestudios.com|SE|Contemporary
Jacquemus|jacquemus.com|FR|Contemporary
Nanushka|nanushka.com|HU|Contemporary
Sandro|sandro-paris.com|FR|Contemporary
Maje|maje.com|FR|Contemporary
Reiss|reiss.com|GB|Contemporary
COS|cosstores.com|SE|Contemporary
Arket|arket.com|SE|Contemporary
Massimo Dutti|massimodutti.com|ES|Contemporary
Theory|theory.com|US|Contemporary
Vince|vince.com|US|Contemporary
Everlane|everlane.com|US|Contemporary
Reformation|thereformation.com|US|Contemporary
Ganni|ganni.com|DK|Contemporary
Sézane|sezane.com|FR|Contemporary
Calvin Klein|calvinklein.com|US|Contemporary
Tommy Hilfiger|tommy.com|US|Contemporary
Hugo Boss|hugoboss.com|DE|Contemporary
Michael Kors|michaelkors.com|US|Contemporary
Coach|coach.com|US|Contemporary
Kate Spade|katespade.com|US|Contemporary
Fossil|fossil.com|US|Contemporary
Ray-Ban|ray-ban.com|IT|Contemporary
Longines|longines.com|CH|Contemporary
Casio|casio.com|JP|Contemporary
Zara|zara.com|ES|High Street
H&M|hm.com|SE|High Street
Uniqlo|uniqlo.com|JP|High Street
Mango|mango.com|ES|High Street
Bershka|bershka.com|ES|High Street
Pull&Bear|pullandbear.com|ES|High Street
Gap|gap.com|US|High Street
Levi's|levi.com|US|High Street
Next|next.co.uk|GB|High Street
Marks & Spencer|marksandspencer.com|GB|High Street
Primark|primark.com|IE|High Street
ASOS|asos.com|GB|High Street
Shein|shein.com|CN|High Street
Muji|muji.com|JP|High Street
J.Crew|jcrew.com|US|High Street
River Island|riverisland.com|GB|High Street
Nike|nike.com|US|Sport & Street
Adidas|adidas.com|DE|Sport & Street
Puma|puma.com|DE|Sport & Street
New Balance|newbalance.com|US|Sport & Street
Reebok|reebok.com|US|Sport & Street
Under Armour|underarmour.com|US|Sport & Street
Lululemon|lululemon.com|CA|Sport & Street
Asics|asics.com|JP|Sport & Street
Converse|converse.com|US|Sport & Street
Vans|vans.com|US|Sport & Street
Supreme|supremenewyork.com|US|Sport & Street
Stüssy|stussy.com|US|Sport & Street
Off-White|off---white.com|IT|Sport & Street
Fear of God|fearofgod.com|US|Sport & Street
Carhartt WIP|carhartt-wip.com|DE|Sport & Street
Stone Island|stoneisland.com|IT|Sport & Street
Aimé Leon Dore|aimeleondore.com|US|Sport & Street
Palace|palaceskateboards.com|GB|Sport & Street
The North Face|thenorthface.com|US|Sport & Street
Patagonia|patagonia.com|US|Sport & Street
Arc'teryx|arcteryx.com|CA|Sport & Street
Salomon|salomon.com|FR|Sport & Street
On Running|on.com|CH|Sport & Street
Hoka|hoka.com|US|Sport & Street
Bape|bape.com|JP|Sport & Street
Comme des Garçons|comme-des-garcons.com|JP|Luxury
Issey Miyake|isseymiyake.com|JP|Luxury
Rick Owens|rickowens.eu|US|Luxury
Khaadi|khaadi.com|PK|South Asia
Gul Ahmed|gulahmedshop.com|PK|South Asia
Maria B.|mariab.pk|PK|South Asia
Alkaram Studio|alkaramstudio.com|PK|South Asia
Sana Safinaz|sanasafinaz.com|PK|South Asia
Junaid Jamshed|junaidjamshed.com|PK|South Asia
Sabyasachi|sabyasachi.com|IN|South Asia
Manish Malhotra|manishmalhotra.in|IN|South Asia
FabIndia|fabindia.com|IN|South Asia
Anita Dongre|anitadongre.com|IN|South Asia
Farfetch|farfetch.com|PT|Retailer
SSENSE|ssense.com|CA|Retailer
Net-a-Porter|net-a-porter.com|GB|Retailer
Mytheresa|mytheresa.com|DE|Retailer
Ounass|ounass.com|AE|Retailer
Namshi|namshi.com|AE|Retailer
Zalando|zalando.com|DE|Retailer
Nordstrom|nordstrom.com|US|Retailer
Selfridges|selfridges.com|GB|Retailer
Harrods|harrods.com|GB|Retailer
Saks Fifth Avenue|saksfifthavenue.com|US|Retailer
Lane Crawford|lanecrawford.com|HK|Retailer
`;

export const BRANDS = RAW.trim().split('\n').map(line => {
  const [name, domain, country, tier] = line.split('|');
  return { name, domain, country, tier };
});

export const normName = s =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const byName = new Map(BRANDS.map(b => [normName(b.name), b]));
export const findBrand = name => byName.get(normName(name)) || null;
