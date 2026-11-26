// Curated, ILLUSTRATIVE catalogue: piece names are typical of each brand's range, but prices are
// rough USD estimates and stock is not real. Replace with a retail affiliate feed for real data.
// Format: brand | piece | category | gender (m/w/u) | approx USD | archetype ids
const RAW = `
Khaadi|Embroidered Lawn 3-Piece Suit|Dresses|w|38|desi-classic,floral
Khaadi|Printed Cotton Kurta|Tops|w|19|desi-classic,casual
Khaadi|Men's Cotton Kurta|Tops|m|24|desi-classic
Khaadi|Straight Cotton Trousers|Bottoms|w|14|desi-classic,minimalism
Gul Ahmed|Digital Print Lawn Unstitched 3-Piece|Dresses|w|32|desi-classic,floral
Gul Ahmed|Winter Khaddar Shalwar Kameez|Dresses|w|40|desi-classic
Gul Ahmed|Men's Wash & Wear Shalwar Kameez|Dresses|m|28|desi-classic
Gul Ahmed|Pashmina Printed Shawl|Outerwear|w|30|desi-classic,old-money
Maria B.|Chiffon Embroidered Formal Suit|Dresses|w|170|desi-festive,floral
Maria B.|Bridal Net Lehnga|Dresses|w|620|desi-festive
Maria B.|Linen Casual Co-ord|Dresses|w|55|desi-classic,minimalism
Alkaram Studio|Chikankari Lawn Suit|Dresses|w|34|desi-classic,floral
Alkaram Studio|Mint Embroidered Kurta|Tops|w|22|desi-classic,boho
Sana Safinaz|Luxe Embroidered Lawn Suit|Dresses|w|95|desi-festive,floral
Sana Safinaz|Silk Straight Pants|Bottoms|w|36|desi-festive,quiet-luxury
Junaid Jamshed|Men's Premium Kurta|Tops|m|33|desi-classic,old-money
Junaid Jamshed|Peshawari Chappal|Shoes|m|42|desi-classic,retro-vintage
Junaid Jamshed|Wool Waistcoat|Outerwear|m|65|desi-festive,business-casual
Junaid Jamshed|Prince Coat Set|Outerwear|m|210|desi-festive
Sapphire|Printed Lawn Kurta|Tops|w|26|desi-classic,casual
Sapphire|Embroidered Net Dupatta Set|Dresses|w|85|desi-festive
Sapphire|Cotton Co-ord Set|Dresses|w|45|casual,minimalism
Nishat Linen|Printed Khaddar 2-Piece|Dresses|w|28|desi-classic
Nishat Linen|Embroidered Cambric Kurta|Tops|w|30|desi-classic,floral
Bonanza Satrangi|Digital Floral Lawn Suit|Dresses|w|30|floral,desi-classic
Bonanza Satrangi|Men's Cotton Shirt|Tops|m|22|casual,business-casual
Limelight|Oversized Graphic Tee|Tops|w|14|casual,streetwear
Limelight|Wide-Leg Cotton Pants|Bottoms|w|18|casual,minimalism
Limelight|Embroidered Short Kurta|Tops|w|20|desi-classic,boho
Breakout|Boyfriend Denim Jeans|Bottoms|w|27|casual,grunge
Breakout|Satin Slip Dress|Dresses|w|35|old-money,minimalism
Outfitters|Oversized Hoodie|Tops|m|28|streetwear,athleisure
Outfitters|Cargo Pants|Bottoms|m|30|streetwear,gorpcore
Outfitters|Linen Blend Shirt|Tops|m|24|casual,business-casual
Outfitters|Straight Fit Jeans|Bottoms|m|32|casual,grunge
Generation|Embroidered Lawn Suit|Dresses|w|36|desi-classic
Ethnic|Cotton Straight Kurta|Tops|w|18|desi-classic,casual
Agha Noor|Luxury Lawn Unstitched Suit|Dresses|w|48|desi-classic,floral
Zellbury|Casual Printed Kurta|Tops|w|17|desi-classic,casual
Asim Jofa|Embroidered Chiffon Luxury Suit|Dresses|w|210|desi-festive
Elan|Pret Embroidered Gown|Dresses|w|320|desi-festive,floral
Faraz Manan|Bridal Gharara Set|Dresses|w|900|desi-festive
Sobia Nazir|Luxe Lawn Suit|Dresses|w|85|desi-festive,floral
HSY|Embellished Sherwani|Outerwear|m|650|desi-festive
HSY|Silk Formal Kurta Set|Dresses|w|280|desi-festive,quiet-luxury
Deepak Perwani|Velvet Waistcoat|Outerwear|m|240|desi-festive,old-money
Republic Womenswear|Raw Silk Kurta|Tops|w|75|desi-festive,minimalism
Zara Shahjahan|Embroidered Lawn Luxury Suit|Dresses|w|120|desi-festive,floral
Mushq|Block Print Cotton Kurta|Tops|w|34|boho,desi-classic
Nida Azwer|Printed Silk Kurta|Tops|w|60|desi-classic,boho
Rang Ja|Block Print Kurta|Tops|w|22|boho,desi-classic
Cross Stitch|Embroidered Lawn Suit|Dresses|w|30|desi-classic
Almirah|Printed Co-ord Set|Dresses|w|33|casual,floral
Edenrobe|Men's Linen Kurta|Tops|m|26|desi-classic,minimalism
Edenrobe|Chino Trousers|Bottoms|m|24|business-casual,preppy
Beechtree|Printed Lawn Suit|Dresses|w|36|desi-classic,floral
Bareeze|Luxury Chiffon Suit|Dresses|w|150|desi-festive
Ndure|Graphic Tee|Tops|m|12|casual,streetwear
Ndure|Leather Chelsea Boots|Shoes|m|55|business-casual,old-money
Engine|Slim Fit Denim Jacket|Outerwear|m|34|casual,grunge,starboy
Engine|Cotton Polo Shirt|Tops|m|18|preppy,casual
Leisure Club|Oversized Streetwear Hoodie|Tops|u|26|streetwear
Charcoal|Formal Slim Dress Shirt|Tops|m|26|business-casual
Charcoal|Tailored Wool-Blend Blazer|Outerwear|m|85|business-casual,old-money
Zeen|Embroidered Kurta|Tops|w|24|desi-classic
Saya|Embroidered Lawn Suit|Dresses|w|38|desi-classic,floral
So Kamal|Printed Lawn 3-Piece|Dresses|w|34|desi-classic
Tena Durrani|Printed Silk Kurta|Tops|w|58|desi-classic,boho
Kayseria|Cotton Printed Kurta|Tops|w|20|desi-classic,floral
Ali Xeeshan|Statement Embroidered Coat|Outerwear|u|520|desi-festive,starboy
Khas|Woolen Shawl|Outerwear|w|36|desi-classic,old-money
Uniworth|Men's Dress Shirt|Tops|m|23|business-casual
Stylo|Women's Block Heel Sandals|Shoes|w|32|desi-festive,business-casual
Stylo|Embroidered Khussa|Shoes|w|24|desi-classic,desi-festive
Borjan|Leather Loafers|Shoes|m|46|old-money,business-casual
Borjan|Kolhapuri Flat Sandals|Shoes|w|20|desi-classic,boho
Metro Shoes|Pointed Pump Heels|Shoes|w|38|desi-festive
Metro Shoes|Sneakers Everyday White|Shoes|u|34|casual,minimalism
Servis|Leather Derby Shoes|Shoes|m|50|business-casual
Bata Pakistan|Canvas Sneakers|Shoes|u|18|casual,retro-vintage
Diners|Men's Casual Sneakers|Shoes|m|28|casual,streetwear
Orient Textiles|Printed Lawn Unstitched|Dresses|w|26|desi-classic
Ideas by Gul Ahmed|Cotton Summer Kurta|Tops|w|20|desi-classic,casual
Zara|Wide-Leg Pleated Trousers|Bottoms|w|50|minimalism,old-money
Zara|Oversized Blazer|Outerwear|w|90|business-casual,minimalism
Zara|Cargo Parachute Pants|Bottoms|m|45|streetwear,gorpcore
H&M|Oversized Cotton Hoodie|Tops|u|35|streetwear,casual
H&M|Linen-Blend Shirt|Tops|m|28|casual,minimalism
Uniqlo|Supima Cotton Crew Tee|Tops|u|20|minimalism,casual
Uniqlo|Heattech Ultra-Light Down Jacket|Outerwear|u|90|minimalism,gorpcore
Uniqlo|Wide Chino Trousers|Bottoms|m|40|casual,preppy
Mango|Satin Midi Dress|Dresses|w|80|old-money,floral
Mango|Trench Coat|Outerwear|w|130|dark-academia,old-money
Levi's|501 Original Jeans|Bottoms|u|85|casual,retro-vintage,grunge
Levi's|Trucker Denim Jacket|Outerwear|u|95|casual,grunge,retro-vintage
Nike|Air Force 1 Low|Shoes|u|115|streetwear,casual
Nike|Tech Fleece Joggers|Bottoms|m|110|athleisure,streetwear
Nike|Dri-FIT Running Top|Tops|u|40|athleisure
Adidas|Samba OG Sneakers|Shoes|u|100|casual,retro-vintage,streetwear
Adidas|Track Jacket Firebird|Outerwear|u|75|retro-vintage,y2k,athleisure
New Balance|550 Sneakers|Shoes|u|130|streetwear,retro-vintage
New Balance|Grey 990v6 Running Shoes|Shoes|u|200|casual,streetwear
Converse|Chuck 70 High Top|Shoes|u|90|casual,grunge,retro-vintage
Vans|Old Skool Classic|Shoes|u|70|grunge,streetwear
Dr. Martens|1460 Leather Boots|Shoes|u|190|grunge,dark-academia
Birkenstock|Arizona Suede Sandals|Shoes|u|150|boho,minimalism
The North Face|Nuptse 700 Puffer|Outerwear|u|330|gorpcore,streetwear
Patagonia|Better Sweater Fleece|Outerwear|u|140|gorpcore,casual
Arc'teryx|Beta LT Shell Jacket|Outerwear|u|450|gorpcore
Salomon|XT-6 Trail Sneakers|Shoes|u|200|gorpcore,streetwear
Lululemon|Align High-Rise Leggings|Bottoms|w|98|athleisure
Gymshark|Seamless Training Tee|Tops|u|35|athleisure
Alo Yoga|Airlift Intrigue Bra|Tops|w|68|athleisure
Skims|Fits Everybody Bodysuit|Tops|w|68|y2k,minimalism
Supreme|Box Logo Hoodie|Tops|u|450|streetwear
Stüssy|8-Ball Tee|Tops|u|55|streetwear,casual
Fear of God|Essentials Hoodie|Tops|u|120|streetwear,minimalism
Carhartt WIP|Detroit Jacket|Outerwear|u|230|streetwear,retro-vintage
Aimé Leon Dore|Pleated Wool Trousers|Bottoms|m|295|old-money,streetwear
Kith|Williams Hoodie|Tops|u|165|streetwear
Rhude|Racing Graphic Tee|Tops|m|215|starboy,streetwear
Amiri|MX1 Skinny Jeans|Bottoms|m|900|starboy,grunge
Chrome Hearts|Cross Patch Cap|Accessories|u|420|starboy,grunge
Gallery Dept|Painted Flare Jeans|Bottoms|u|450|starboy,retro-vintage
Represent|Owners Club Hoodie|Tops|u|140|streetwear
Corteiz|Rules The World Cargos|Bottoms|u|130|streetwear
Trapstar|Irongate Puffer Jacket|Outerwear|u|250|streetwear,starboy
Bape|Shark Full-Zip Hoodie|Outerwear|u|380|streetwear,y2k
Off-White|Industrial Belt|Accessories|u|160|streetwear,starboy
Saint Laurent|Leather Biker Jacket|Outerwear|u|3900|starboy,grunge
Saint Laurent|Square Frame Sunglasses|Eyewear|u|420|starboy,old-money
Balenciaga|Triple S Sneakers|Shoes|u|1050|streetwear,starboy
Gucci|Horsebit Loafers|Shoes|u|890|old-money,business-casual
Gucci|GG Marmont Shoulder Bag|Bags|w|2300|old-money,starboy
Prada|Re-Nylon Backpack|Bags|u|1650|minimalism,gorpcore
Loro Piana|Cashmere Crew Sweater|Tops|u|1150|quiet-luxury,old-money
Brunello Cucinelli|Cashmere Turtleneck|Tops|u|1500|quiet-luxury,old-money
The Row|Margaux Leather Tote|Bags|w|4500|quiet-luxury,minimalism
Hermès|Silk Twill Scarf|Accessories|w|440|old-money,quiet-luxury
Burberry|Heritage Trench Coat|Outerwear|u|2490|old-money,dark-academia
Ralph Lauren|Cable-Knit Cotton Sweater|Tops|u|198|preppy,old-money
Ralph Lauren|Classic Oxford Shirt|Tops|m|125|preppy,business-casual
Brooks Brothers|Navy Wool Blazer|Outerwear|m|498|old-money,business-casual,preppy
Drake's|Silk Knit Tie|Accessories|m|165|old-money,business-casual
Barbour|Beaufort Waxed Jacket|Outerwear|u|430|old-money,gorpcore,dark-academia
Fred Perry|Twin Tipped Polo|Tops|u|110|preppy,retro-vintage
Sunspel|Riviera Polo|Tops|m|150|old-money,quiet-luxury
Hugo Boss|Slim-Fit Wool Suit|Outerwear|m|695|business-casual
Reiss|Tailored Wool Blazer|Outerwear|u|320|business-casual,old-money
Theory|Stretch Wool Trousers|Bottoms|w|265|business-casual,minimalism
Everlane|The Organic Cotton Box-Cut Tee|Tops|u|30|minimalism,casual
COS|Merino Wool Cardigan|Tops|u|99|minimalism,quiet-luxury
Jil Sander|Poplin Shirt|Tops|u|690|minimalism,quiet-luxury
Lemaire|Twisted Overshirt|Outerwear|u|690|minimalism,quiet-luxury
Toteme|Signature Wool Coat|Outerwear|w|1090|quiet-luxury,minimalism
A.P.C.|New Standard Jeans|Bottoms|m|230|minimalism,casual
Our Legacy|Boxy Cotton Shirt|Tops|m|230|minimalism,dark-academia
Studio Nicholson|Wide Pleat Trousers|Bottoms|u|370|minimalism,old-money
Thom Browne|Striped Cardigan|Tops|u|1190|preppy,old-money
Ganni|Printed Mesh Maxi Dress|Dresses|w|345|floral,y2k
Reformation|Floral Midi Dress|Dresses|w|278|floral
Zimmermann|Linen Floral Sundress|Dresses|w|750|floral,boho
LoveShackFancy|Ruffle Floral Mini Dress|Dresses|w|395|floral
Hill House Home|Nap Dress in Garden Print|Dresses|w|150|floral
Rixo|Silk Floral Wrap Dress|Dresses|w|320|floral,retro-vintage
Cecilie Bahnsen|Tulle Puff-Sleeve Dress|Dresses|w|1250|floral,quiet-luxury
Ulla Johnson|Embroidered Peasant Blouse|Tops|w|380|boho,floral
Free People|Fringe Suede Vest|Outerwear|w|150|boho,retro-vintage
Anthropologie|Embroidered Maxi Skirt|Bottoms|w|110|boho,floral
Farm Rio|Tropical Floral Maxi Dress|Dresses|w|210|floral,boho
Isabel Marant|Embroidered Boho Blouse|Tops|w|420|boho
Urban Outfitters|Baby Tee Butterfly Print|Tops|w|24|y2k,casual
Miu Miu|Low-Rise Mini Skirt|Bottoms|w|1100|y2k,preppy
Versace|Medusa Chain Belt|Accessories|u|480|y2k,starboy
Dolce & Gabbana|Leopard Print Silk Shirt|Tops|u|1450|starboy,retro-vintage
Tom Ford|Aviator Sunglasses|Eyewear|u|480|starboy,old-money
Ray-Ban|Wayfarer Classic|Eyewear|u|165|casual,retro-vintage,starboy
Rolex|Datejust 36|Watches|u|8500|old-money,business-casual
Longines|Heritage Classic Watch|Watches|u|2200|old-money,business-casual
Casio|Vintage Digital A168|Watches|u|55|retro-vintage,casual,y2k
Fossil|Minimalist Leather Watch|Watches|u|130|minimalism,business-casual
Cartier|Love Bracelet|Jewellery|u|7500|quiet-luxury,old-money
Tiffany & Co.|Return to Tiffany Heart Tag Necklace|Jewellery|w|425|y2k,preppy
Coach|Tabby Shoulder Bag|Bags|w|395|y2k,old-money
Michael Kors|Jet Set Travel Tote|Bags|w|298|business-casual
Tory Burch|Fleming Mini Bag|Bags|w|498|old-money
Sabyasachi|Bridal Silk Lehnga|Dresses|w|3800|desi-festive
Manish Malhotra|Sequin Saree|Dresses|w|1900|desi-festive
FabIndia|Handloom Cotton Kurta|Tops|u|35|desi-classic,boho
Anita Dongre|Silk Anarkali|Dresses|w|420|desi-festive,floral
Thebe Magugu|Printed Silk Shirt Dress|Dresses|w|780|floral,retro-vintage
Orange Culture|Oversized Tailored Shirt|Tops|u|190|streetwear,minimalism
Lisa Folawiyo|Ankara Embellished Dress|Dresses|w|620|desi-festive,floral
Osklen|Technical Overshirt|Outerwear|m|290|gorpcore,minimalism
Comme des Garçons|Play Heart Logo Tee|Tops|u|95|y2k,minimalism
Visvim|Indigo-Dyed Denim Jacket|Outerwear|u|1100|retro-vintage,gorpcore
Kapital|Boro Patchwork Cardigan|Tops|u|600|boho,retro-vintage
Needles|Track Pants Butterfly|Bottoms|u|230|y2k,retro-vintage
Beams|Oversized Oxford Shirt|Tops|m|120|casual,preppy
Muji|Organic Cotton Wide Pants|Bottoms|u|40|minimalism,casual
Massimo Dutti|Houndstooth Wool Coat|Outerwear|u|230|dark-academia,old-money
Maje|Tweed Jacket|Outerwear|w|425|dark-academia,old-money
Sandro|Knit Polo Dress|Dresses|w|285|old-money,preppy
Acne Studios|Face Patch Scarf|Accessories|u|180|minimalism,starboy
Jacquemus|Le Chiquito Mini Bag|Bags|w|480|minimalism,y2k
Aritzia|Wilfred Cozy Cardigan|Tops|w|98|minimalism,casual
Abercrombie & Fitch|Baggy Jeans|Bottoms|u|90|casual,grunge,y2k
American Eagle|Faux Leather Bomber|Outerwear|m|110|starboy,grunge
Mr Porter|Linen Camp Collar Shirt|Tops|m|160|old-money,casual
Todd Snyder|Italian Wool Sport Coat|Outerwear|m|498|old-money,business-casual,dark-academia
`;

const G = { m: 'men', w: 'women', u: 'unisex' };
export const CURATED = RAW.trim().split('\n').map(line => {
  const [brand, name, category, g, usd, arch] = line.split('|');
  return { brand, name, category, gender: G[g], priceUsd: Number(usd), archetypes: arch.split(',') };
});
