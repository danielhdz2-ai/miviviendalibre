// Primero obtenemos una URL real del listado
const listUrl = 'https://www.pisos.com/venta/pisos-barcelona/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

fetch(listUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'es-ES,es;q=0.9' } })
  .then(r => r.text())
  .then(async html => {
    // Extraer primera URL de detalle del JSON-LD
    const jldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let m; let detailUrl = null;
    while((m = jldRe.exec(html))) {
      try { const d = JSON.parse(m[1]); if(d['@type']==='SingleFamilyResidence'||d['@type']==='Apartment') { detailUrl = d.url; break; } } catch(e){}
    }
    if(!detailUrl) { console.log('NO DETAIL URL'); return; }
    if(!detailUrl.startsWith('http')) detailUrl = 'https://www.pisos.com' + detailUrl;
    console.log('Detail URL:', detailUrl);
    await new Promise(r => setTimeout(r, 1500));
    
    const dHtml = await fetch(detailUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'es-ES,es;q=0.9', 'Referer': listUrl } }).then(r=>r.text());
    
    // Imágenes
    const imgRe = /fotos\.imghs\.net\/[^"'\s)\\]+/g;
    const imgs = [...new Set(dHtml.match(imgRe)||[])].filter(u => !u.includes('avatares'));
    console.log('IMAGENES ('+imgs.length+'):'); imgs.slice(0,8).forEach(u => console.log(' ', u.slice(0,100)));

    // JSON-LD
    const jldRe2 = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    while((m = jldRe2.exec(dHtml))) {
      try {
        const d = JSON.parse(m[1]);
        if(!d['@type']) continue;
        console.log('\nJLD @type='+d['@type']);
        if(d.description) console.log('  desc:', d.description.slice(0,200));
        if(d.image) console.log('  images count:', Array.isArray(d.image)?d.image.length:1, JSON.stringify(d.image).slice(0,300));
        if(d.numberOfRooms!=null) console.log('  rooms:', d.numberOfRooms);
        if(d.numberOfBathroomsTotal!=null) console.log('  baths:', d.numberOfBathroomsTotal);
        if(d.floorSize) console.log('  floorSize:', JSON.stringify(d.floorSize));
        if(d.geo) console.log('  geo:', JSON.stringify(d.geo));
        if(d.address) console.log('  address:', JSON.stringify(d.address));
        if(d.offers) console.log('  offers:', JSON.stringify(d.offers));
        if(d.name) console.log('  name:', d.name.slice(0,100));
      } catch(e){}
    }
    
    // Meta description
    const meta = dHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]{0,1000})"/);
    console.log('\nMETA DESC:', meta ? meta[1].slice(0,300) : 'NO');
    
    // Lat/lng  
    const lat = dHtml.match(/"latitude":\s*([\d.,+-]+)/); console.log('LAT:', lat?lat[1]:'NO');
    const lng = dHtml.match(/"longitude":\s*([\d.,+-]+)/); console.log('LNG:', lng?lng[1]:'NO');
    
    // Planta
    const planta = dHtml.match(/[Pp]lanta\s*[:;]?\s*([^\s<,]{1,20})/g); console.log('PLANTA:', planta?planta.slice(0,3):'NO');
    
    // Habitaciones en texto
    const habs = dHtml.match(/(\d+)\s*habitac/gi); console.log('HABS TEXT:', habs?habs.slice(0,4):'NO');
    const banos = dHtml.match(/(\d+)\s*ba[ñn]o/gi); console.log('BANOS TEXT:', banos?banos.slice(0,4):'NO');
  })
  .catch(e => console.error('ERROR:', e.message));

