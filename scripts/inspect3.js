const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetch(url, maxBytes=300000) {
  return new Promise((resolve) => {
    let u
    try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'text/html,application/json,*/*', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 12000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          fetch(next).then(resolve); return
        }
        let body = ''
        res.on('data', d => { if(body.length < maxBytes) body+=d })
        res.on('end', () => resolve({ status: res.statusCode, body, ct: res.headers['content-type'] }))
      }
    )
    req.on('error', e => resolve({ err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ err: 'TIMEOUT' }) })
  })
}

async function checkPisosComDetail() {
  console.log('🏠 pisos.com — Detalle de anuncio individual')
  const url = 'https://www.pisos.com/comprar/piso-universidad_malasana28004-63412235710_528715/'
  const r = await fetch(url)
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  // Extraer todos los JSON-LD
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = regex.exec(r.body))) {
    try {
      const d = JSON.parse(m[1])
      const t = d['@type']
      if (['Apartment','SingleFamilyResidence','RealEstateListing','House','Residence','Product'].includes(t)) {
        console.log('\n✅ JSON-LD listing FULL:')
        console.log(JSON.stringify(d, null, 2))
        return
      }
    } catch {}
  }

  // Si no hay JSON-LD con precio, buscar precios en el HTML
  const precios = r.body.match(/\d{1,3}(\.\d{3})+\s*€/g) || []
  console.log('Precios en HTML:', precios.slice(0, 5))

  // buscar m2
  const m2 = r.body.match(/\d+\s*m²/g) || []
  console.log('m²:', m2.slice(0, 3))
}

async function checkGilmarAPI() {
  console.log('\n\n🔍 Gilmar WP REST API')

  // Tipos de contenido custom en WP
  const urls = [
    'https://www.gilmar.es/wp-json/wp/v2/',
    'https://www.gilmar.es/wp-json/wp/v2/types',
    'https://www.gilmar.es/wp-json/wp/v2/inmuebles?per_page=3&_fields=id,title,slug,link,meta',
    'https://www.gilmar.es/wp-json/wp/v2/properties?per_page=3&_fields=id,title,slug,link',
    'https://www.gilmar.es/wp-json/wp/v2/propiedad?per_page=3',
    // Buscar endpoint de listados
    'https://www.gilmar.es/wp-json/gilmar/v1/properties?per_page=5',
    // AJAX endpoint usual de WordPress themes inmobiliarios
    'https://www.gilmar.es/wp-admin/admin-ajax.php',
  ]

  for (const url of urls) {
    const r = await fetch(url)
    if (r.err) { console.log(`❌ ${url.split('/').slice(-2).join('/')}: ${r.err}`); continue }
    const isJson = (r.ct||'').includes('json')
    const preview = r.body.slice(0, 300)
    console.log(`\n[${r.status}] ${url.split('/').slice(-3).join('/')}`)
    if (isJson) {
      try {
        const j = JSON.parse(r.body)
        if (Array.isArray(j)) {
          console.log(`  Array[${j.length}]:`, j.slice(0,2).map(x => ({ id: x.id, type: x.type || x.name, slug: x.slug })))
        } else if (j.types || j.namespaces) {
          console.log('  WP API types:', Object.keys(j.types || j).slice(0, 15))
        } else {
          console.log('  JSON:', JSON.stringify(j).slice(0, 200))
        }
      } catch { console.log('  Body:', preview) }
    } else {
      if (r.status === 200) console.log('  HTML/text response:', preview.slice(0, 100))
    }
  }
}

async function main() {
  await checkPisosComDetail()
  await checkGilmarAPI()
}
main()
