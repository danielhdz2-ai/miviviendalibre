const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
fetch('https://www.pisos.com/comprar/piso-collblanc08904-63392603320_525021/', {
  headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'es-ES,es;q=0.9' }
})
.then(r => r.text())
.then(html => {
  // 1. Body description class patterns
  const desc1 = html.match(/class="[^"]*(?:texto-anuncio|ad-description|descripcion|description-content|adDescription)[^"]*"[^>]*>([\s\S]{50,5000}?)<\/(?:div|p|section)/i);
  console.log('BODY DESC:', desc1 ? desc1[1].replace(/<[^>]+>/g,'').trim().slice(0,500) : 'NO');

  // 2. __NEXT_DATA__
  const nextdata = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]{100,}?)<\/script>/);
  if (nextdata) {
    try {
      const nd = JSON.parse(nextdata[1]);
      const str = JSON.stringify(nd);
      const descM = str.match(/"description":"((?:[^"\\]|\\.)*)"/);
      console.log('NEXT DESC:', descM ? descM[1].slice(0, 600) : 'NO');
      const roomsM = str.match(/"numberOfRooms":(\d+)/);
      console.log('NEXT ROOMS:', roomsM ? roomsM[1] : 'NO');
      const bathsM = str.match(/"numberOfBathroomsTotal":(\d+)/);
      console.log('NEXT BATHS:', bathsM ? bathsM[1] : 'NO');
      const latM = str.match(/"latitude":"?([0-9.,+-]+)"?/);
      const lngM = str.match(/"longitude":"?([0-9.,+-]+)"?/);
      console.log('NEXT LAT:', latM ? latM[1] : 'NO', '| LNG:', lngM ? lngM[1] : 'NO');
      // Find images array in JSON
      const imgM = str.match(/"image":\["(https?:[^"]+)"[^\]]*\]/);
      console.log('NEXT IMAGES ARRAY:', imgM ? imgM[0].slice(0,300) : 'NO');
    } catch(e) {
      console.log('NEXT PARSE ERR:', e.message.slice(0,100));
    }
  } else {
    console.log('NO __NEXT_DATA__');
  }

  // 3. Unique image UUIDs
  const allImgs = [...html.matchAll(/fotos\.imghs\.net\/([\w-]+)\/(\d+)\/[^"'\s)\\]+/g)];
  const uuids = new Set();
  for (const m of allImgs) {
    const uM = m[0].match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uM) uuids.add(uM[0]);
  }
  console.log('UNIQUE IMAGE UUIDS:', uuids.size);
  // Build fch-wp URLs
  const fchImgs = [];
  for (const m of allImgs) {
    const uM = m[0].match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!uM) continue;
    const uuid = uM[0];
    if (fchImgs.some(u => u.includes(uuid))) continue;
    // Find the fch-wp version
    const fchMatch = allImgs.find(mm => mm[1] === 'fch-wp' && mm[0].includes(uuid));
    if (fchMatch) fchImgs.push('https://' + fchMatch[0]);
  }
  console.log('FCH IMAGES:', fchImgs.length);
  fchImgs.slice(0,5).forEach(u => console.log(' ', u.slice(0,100)));

  // 4. Meta description full
  const meta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{0,5000})"/i);
  console.log('META LEN:', meta ? meta[1].length : 0);
  console.log('META FULL:', meta ? meta[1].slice(0, 800) : 'NO');

  // 5. Habitaciones / baños en JSON
  const habsJ = html.match(/"habitaciones?"\s*:\s*"?(\d+)"?/i);
  const banosJ = html.match(/"ba[ny]os?"\s*:\s*"?(\d+)"?/i);
  const supJ = html.match(/"superficie[^"]*"\s*:\s*"?(\d+)"?/i);
  console.log('JSON habs:', habsJ ? habsJ[1] : 'NO', '| banos:', banosJ ? banosJ[1] : 'NO', '| sup:', supJ ? supJ[1] : 'NO');

  // 6. Property features in structured data
  const featRe = /"name"\s*:\s*"([^"]{3,50})"\s*,\s*"value"\s*:\s*"([^"]{1,100})"/g;
  const feats = [];
  let fm;
  while ((fm = featRe.exec(html)) && feats.length < 15) feats.push(fm[1] + ': ' + fm[2]);
  console.log('FEATURES:', feats.length > 0 ? feats.join(' | ') : 'NO');
})
.catch(e => console.error('ERROR:', e.message));
