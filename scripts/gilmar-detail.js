const https = require('https')
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetchUrl(url) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'text/html,*/*', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 12000 },
      (res) => {
        let body = ''
        res.on('data', d => { if(body.length < 300000) body+=d })
        res.on('end', () => resolve({ status: res.statusCode, body }))
      }
    )
    req.on('error', e => resolve({ err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ err: 'TIMEOUT' }) })
  })
}

async function main() {
  console.log('=== GILMAR — Precio en página de detalle ===\n')
  const r = await fetchUrl('https://www.gilmar.es/inmueble/comprar-piso-prosperidad-madrid-referencia-221515/')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }
  
  // Buscar precios
  const precios1 = r.body.match(/\d{1,3}(\.\d{3})+\s*€/g) || []
  const precios2 = r.body.match(/[\d.,]+\s*€/g) || []
  console.log('Precios formato ES:', [...new Set(precios1)])
  console.log('Precios en HTML:', [...new Set(precios2)].slice(0, 5))

  // Buscar el precio en elementos HTML
  const priceEls = r.body.match(/class="[^"]*(?:price|precio)[^"]*"[^>]*>([^<]+)</gi) || []
  console.log('Price class elements:', priceEls.slice(0, 5))
  
  // Ver title
  const title = (r.body.match(/<title>([^<]+)/) || [])[1]
  console.log('\nTitle:', title)

  // Ver meta description
  const desc = (r.body.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/) || [])[1]
  console.log('Meta desc:', desc?.slice(0, 200))

  // Ver h1-h2 headings
  const headings = r.body.match(/<h[12][^>]*>([^<]+)<\/h[12]>/gi) || []
  console.log('\nHeadings:', headings.map(h => h.replace(/<[^>]+>/g, '')).slice(0, 5))

  // Buscar spans/divs con datos
  const spans = r.body.match(/<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)<\/span>/gi) || []
  console.log('\nValue spans:', spans.slice(0, 10))

  // Buscar m² y dormitorios
  const m2 = r.body.match(/\d+\s*m[²2]/g) || []
  const habs = r.body.match(/\d+\s*(?:habitacion|dormitor|hab\.)/gi) || []
  const banos = r.body.match(/\d+\s*ba[ñn]o/gi) || []
  console.log('\nM²:', [...new Set(m2)].slice(0, 3))
  console.log('Habs:', [...new Set(habs)].slice(0, 3))
  console.log('Baños:', [...new Set(banos)].slice(0, 3))

  // JSON-LD
  const jldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = jldRegex.exec(r.body))) {
    try {
      const d = JSON.parse(m[1])
      if (d['@type'] || d['@graph']) {
        const type = d['@type'] || 'Graph'
        if (!['WebSite','Organization'].includes(type)) {
          console.log(`\nJSON-LD @type=${type}:`, JSON.stringify(d).slice(0, 600))
        }
      }
    } catch {}
  }

  // Buscar un snippet del HTML alrededor del precio
  const priceIdx = r.body.indexOf('precio')
  if (priceIdx > -1) {
    console.log('\nHTML snippet around "precio":')
    console.log(r.body.slice(Math.max(0, priceIdx-50), priceIdx+300))
  }
}
main()
