const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

fetch('https://www.pisos.com/comprar/piso-collblanc08904-63392603320_525021/', {
  headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'es-ES,es;q=0.9' }
})
.then(r => r.text())
.then(html => {
  // ── 1. Sizes disponibles por UUID ──────────────────────────────
  const byUuid = new Map();
  for (const m of html.matchAll(/fotos\.imghs\.net\/([\w-]+)\/(\d+)\/([^"'\s)\\]+)/g)) {
    const uuidM = m[0].match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!uuidM) continue;
    const uuid = uuidM[0];
    const size = m[1];
    const agent = m[2];
    const rest = m[3];
    if (!byUuid.has(uuid)) byUuid.set(uuid, { sizes: new Set(), agent, rest });
    byUuid.get(uuid).sizes.add(size);
  }
  console.log(`\n=== IMAGES (${byUuid.size} unique UUIDs) ===`);
  for (const [uuid, v] of byUuid.entries()) {
    const sizes = [...v.sizes].join(',');
    // Preferir: fch-wp > xl-wp > apps-wp > fchm-wp
    const sizePick = v.sizes.has('fch-wp') ? 'fch-wp'
      : v.sizes.has('xl-wp') ? 'xl-wp'
      : v.sizes.has('apps-wp') ? 'apps-wp'
      : [...v.sizes][0];
    const url = `https://fotos.imghs.net/${sizePick}/${v.agent}/${v.rest}`;
    console.log(`  [${sizes}] ${url.slice(0, 90)}`);
  }

  // ── 2. Descripción: buscar texto largo en el HTML ──────────────
  console.log('\n=== DESCRIPTION ===');
  // Buscar el bloque más largo sin HTML tags
  let longestText = '';
  const textRe = />([^<]{300,})</g;
  let tm;
  while ((tm = textRe.exec(html))) {
    const t = tm[1].trim();
    if (t.length > longestText.length && !t.startsWith('{') && !t.startsWith('//') && !t.includes('function')) {
      longestText = t;
    }
  }
  console.log('Longest text block (len=' + longestText.length + '):', longestText.slice(0, 600));

  // Buscar patron de descripción específico de pisos.com
  const descPatterns = [
    /id="descripcion-anuncio"[^>]*>([\s\S]{100,5000}?)<\/div>/i,
    /class="[^"]*texto[^"]*"[^>]*>([\s\S]{100,5000}?)<\/div>/i,
    /"texto"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    /"body"\s*:\s*"((?:[^"\\]|\\.){100,})"/,
    /"content"\s*:\s*"((?:[^"\\]|\\.){100,})"/,
  ];
  for (const pat of descPatterns) {
    const m = html.match(pat);
    if (m) {
      const t = m[1].replace(/<[^>]+>/g, '').replace(/\\n/g, '\n').replace(/\\u[\da-f]{4}/gi, c => String.fromCharCode(parseInt(c.slice(2), 16)));
      console.log(`\nMATCH PATTERN ${pat.source.slice(0,30)}...`);
      console.log(t.trim().slice(0, 600));
    }
  }

  // ── 3. Características estructuradas ────────────────────────────
  console.log('\n=== PROPERTIES ===');
  // Buscar arrays de características tipo [{name:X, value:Y}]
  const propRe = /"(?:name|label)"\s*:\s*"([^"]{2,40})"\s*,\s*"(?:value|val|texto)"\s*:\s*"([^"]{1,100})"/g;
  let pm; const props = [];
  while ((pm = propRe.exec(html)) && props.length < 20) props.push(`${pm[1]}: ${pm[2]}`);
  console.log(props.join('\n') || 'NO STRUCTURED PROPS');

  // ── 4. Coordenadas ────────────────────────────────────────────
  console.log('\n=== COORDINATES ===');
  const latM = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i);
  const lngM = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i);
  console.log('lat:', latM ? latM[1] : 'NO', '| lng:', lngM ? lngM[1] : 'NO');
})
.catch(e => console.error('ERROR:', e.message));
