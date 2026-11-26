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
Khaadi|khaadi.com|PK|Pakistan
Gul Ahmed|gulahmedshop.com|PK|Pakistan
Maria B.|mariab.pk|PK|Pakistan
Alkaram Studio|alkaramstudio.com|PK|Pakistan
Sana Safinaz|sanasafinaz.com|PK|Pakistan
Junaid Jamshed|junaidjamshed.com|PK|Pakistan
Sabyasachi|sabyasachi.com|IN|South Asia
Manish Malhotra|manishmalhotra.in|IN|South Asia
FabIndia|fabindia.com|IN|South Asia
Anita Dongre|anitadongre.com|IN|South Asia
Sapphire|pk.sapphireonline.pk|PK|Pakistan
Nishat Linen|nishatlinen.com|PK|Pakistan
Bonanza Satrangi|bonanzasatrangi.com|PK|Pakistan
Limelight|limelight.pk|PK|Pakistan
Breakout|breakout.com.pk|PK|Pakistan
Outfitters|outfitters.com.pk|PK|Pakistan
Generation|generation.com.pk|PK|Pakistan
Ethnic|ethnic.com.pk|PK|Pakistan
Agha Noor|aghanoor.com|PK|Pakistan
Zellbury|zellbury.com|PK|Pakistan
Asim Jofa|asimjofa.com|PK|Pakistan
Elan|elan.pk|PK|Pakistan
Faraz Manan|farazmanan.com|PK|Pakistan
Sobia Nazir|sobianazir.com|PK|Pakistan
HSY|hsy.com.pk|PK|Pakistan
Deepak Perwani|deepakperwani.com|PK|Pakistan
Republic Womenswear|republicwomenswear.com|PK|Pakistan
Zara Shahjahan|zarashahjahan.com|PK|Pakistan
Mushq|mushq.pk|PK|Pakistan
Nida Azwer|nidaazwer.com|PK|Pakistan
Rang Ja|rangja.com|PK|Pakistan
Cross Stitch|crossstitch.pk|PK|Pakistan
Almirah|almirah.com.pk|PK|Pakistan
Edenrobe|edenrobe.com|PK|Pakistan
Beechtree|beechtree.pk|PK|Pakistan
Mausummery|mausummery.com|PK|Pakistan
Bareeze|bareeze.com|PK|Pakistan
Chinyere|chinyere.pk|PK|Pakistan
Ndure|ndure.com|PK|Pakistan
Engine|engine.com.pk|PK|Pakistan
Leisure Club|leisureclub.com.pk|PK|Pakistan
Charcoal|charcoal.com.pk|PK|Pakistan
Zeen|zeen.com.pk|PK|Pakistan
Saya|saya.pk|PK|Pakistan
So Kamal|sokamal.com|PK|Pakistan
Tena Durrani|tenadurrani.com|PK|Pakistan
Kayseria|kayseria.com|PK|Pakistan
Ali Xeeshan|alixeeshan.com|PK|Pakistan
Khas|khas.com.pk|PK|Pakistan
Uniworth|uniworthstore.com|PK|Pakistan
Stylo|stylo.pk|PK|Pakistan
Borjan|borjan.com.pk|PK|Pakistan
Metro Shoes|metroshoes.com|PK|Pakistan
Servis|servis.pk|PK|Pakistan
Bata Pakistan|bata.com.pk|PK|Pakistan
Diners|diners.com.pk|PK|Pakistan
Orient Textiles|orient.com.pk|PK|Pakistan
Ideas by Gul Ahmed|ideas.gulahmedshop.com|PK|Pakistan
Zegna|zegna.com|IT|Luxury
Thom Browne|thombrowne.com|US|Luxury
The Row|therow.com|US|Luxury
Alaïa|maison-alaia.com|FR|Luxury
Marni|marni.com|IT|Luxury
Isabel Marant|isabelmarant.com|FR|Contemporary
Zimmermann|zimmermannwear.com|AU|Contemporary
Paul Smith|paulsmith.com|GB|Contemporary
Barbour|barbour.com|GB|Contemporary
Fred Perry|fredperry.com|GB|Contemporary
Drake's|drakes.com|GB|Contemporary
Sunspel|sunspel.com|GB|Contemporary
Brooks Brothers|brooksbrothers.com|US|Contemporary
Todd Snyder|toddsnyder.com|US|Contemporary
Ledbury|theledbury.com|GB|Contemporary
Our Legacy|ourlegacy.com|SE|Contemporary
Studio Nicholson|studionicholson.com|GB|Contemporary
Tory Burch|toryburch.com|US|Contemporary
Staud|staud.clothing|US|Contemporary
Ulla Johnson|ullajohnson.com|US|Contemporary
Rixo|rixo.co.uk|GB|Contemporary
LoveShackFancy|loveshackfancy.com|US|Contemporary
Hill House Home|hillhousehome.com|US|Contemporary
Cecilie Bahnsen|ceciliebahnsen.com|DK|Contemporary
Kenzo|kenzo.com|FR|Contemporary
Farm Rio|farmrio.com|BR|Contemporary
Osklen|osklen.com|BR|Contemporary
Thebe Magugu|thebemagugu.com|ZA|Contemporary
Orange Culture|orangeculture.com.ng|NG|Contemporary
Lisa Folawiyo|lisafolawiyo.com|NG|Contemporary
Anthropologie|anthropologie.com|US|High Street
Free People|freepeople.com|US|High Street
Urban Outfitters|urbanoutfitters.com|US|High Street
Aritzia|aritzia.com|CA|High Street
Abercrombie & Fitch|abercrombie.com|US|High Street
American Eagle|ae.com|US|High Street
Dr. Martens|drmartens.com|GB|Sport & Street
Birkenstock|birkenstock.com|DE|Sport & Street
Skims|skims.com|US|Sport & Street
Alo Yoga|aloyoga.com|US|Sport & Street
Gymshark|gymshark.com|GB|Sport & Street
Kith|kith.com|US|Sport & Street
Rhude|rhude.com|US|Sport & Street
Amiri|amiri.com|US|Sport & Street
Chrome Hearts|chromehearts.com|US|Sport & Street
Gallery Dept|gallerydept.com|US|Sport & Street
Represent|representclo.com|GB|Sport & Street
Corteiz|crtz.xyz|GB|Sport & Street
Trapstar|trapstarlondon.com|GB|Sport & Street
Visvim|visvim.com|JP|Sport & Street
Kapital|kapital.jp|JP|Sport & Street
Beams|beams.co.jp|JP|Sport & Street
Needles|needles.jp|JP|Sport & Street
Mr Porter|mrporter.com|GB|Retailer
Daraz|daraz.pk|PK|Retailer
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
