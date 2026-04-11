const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
fetch('https://www.pisos.com/comprar/piso-collblanc08904-63392603320_525021/', {
  headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'es-ES,es;q=0.9' }
})
.then(r => r.text())
.then(html => {
  // Guardar para inspección
  const fs = await import('fs');
  // Buscar TODOS los textos grandes (>200 chars sin tags)
  const chunks = html.split('<');
  for (const chunk of chunks) {
    const text = chunk.replace(/^[^>]*>/, '').trim();
    if (text.length > 200 && !text.includes('{') && !text.includes('function')) {
      console.log('LONG TEXT BLOCK:', text.slice(0, 400));
      console.log('---');
    }
  }
  
  // Buscar context JSON con descripcion
  const jsonBlocks = [...html.matchAll(/\{[^<]{300,}\}/g)];
  console.log(`\nJSON BLOCKS: ${jsonBlocks.length}`);
  for (const b of jsonBlocks.slice(0, 5)) {
    const s = b[0];
    if (s.includes('description') || s.includes('descripcion')) {
      console.log('JSON WITH DESC:', s.slice(0, 400));
    }
  }
  
  // Sizes disponibles por UUID
  const byUuid = new Map();
  for (const m of html.matchAll(/fotos\.imghs\.net\/([\w-]+)\/\d+\/[^"'\s)\\]+/g)) {
    const uuid = m[0].match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
    const size = m[1];
    if (!uuid) continue;
    if (!byUuid.has(uuid)) byUuid.set(uuid, new Set());
    byUuid.get(uuid).add(size);
    if (!byUuid.has(uuid + '_url')) byUuid.set(uuid + '_url', m[0]);
  }
  console.log('\nIMAGE UUIDS WITH SIZES:');
  for (const [k, v] of byUuid.entries()) {
    if (k.endsWith('_url')) continue;
    console.log(`  ${k.slice(0,8)}... sizes: ${[...v].join(',')}`);
  }
})
.catch(e => console.error('ERROR:', e.message));
