const https = require('https')
const http = require('http')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sites = [
  // Portales pequeños/medianos
  { name: 'pisos.com',       url: 'https://www.pisos.com/venta/pisos-madrid/' },
  { name: 'habitaclia',      url: 'https://www.habitaclia.com/comprar-piso-en-madrid.htm' },
  { name: 'nuroa',           url: 'https://www.nuroa.es/venta/pisos-madrid/' },
  { name: 'indomio',         url: 'https://www.indomio.es/pisos/madrid/' },
  { name: 'comprarcasa',     url: 'https://www.comprarcasa.com/pisos-venta-madrid/' },
  { name: 'thinkspain',      url: 'https://www.thinkspain.com/property-for-sale/spain/1' },
  { name: 'kyero',           url: 'https://www.kyero.com/es/spain/madrid/apartments-for-sale' },
  // Grandes agencias propias
  { name: 'remax.es',        url: 'https://www.remax.es/resultados?operacion=1&tipo=Apartment&provincia=28' },
  { name: 'century21',       url: 'https://www.century21.es/propiedades/venta/piso/madrid' },
  { name: 'gilmar',          url: 'https://www.gilmar.es/es/compra' },
  { name: 'era-inmob',       url: 'https://www.era.es/propiedades?operacion=compra&tipo=piso&localidad=madrid' },
  { name: 'engel-volkers',   url: 'https://www.engelvoelkers.com/es/residencial/comprar/' },
  { name: 'donpiso',         url: 'https://www.donpiso.com/venta-pisos/madrid/madrid/' },
  { name: 'solvia',          url: 'https://www.solvia.es/compra/pisos/madrid/' },
]

function testSite(site) {
  return new Promise((resolve) => {
    const u = new URL(site.url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.get(
      { hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': ua, Accept: 'text/html,*/*' }, timeout: 9000 },
      (res) => {
        let body = ''
        res.on('data', (d) => { if (body.length < 60000) body += d })
        res.on('end', () => {
          const hits = (body.match(/precio|€|dormitor|m²|habitacion|listing|property/gi) || []).length
          const isBot = body.includes('captcha') || body.includes('DataDome') || body.includes('cf-browser-verification') || body.includes('robot')
          const hasJsonLd = body.includes('"@type":"Residence') || body.includes('"@type":"RealEstate') || body.includes('application/ld+json')
          resolve({ name: site.name, status: res.statusCode, hits, isBot, hasJsonLd, len: body.length })
        })
      }
    )
    req.on('error', (e) => resolve({ name: site.name, status: 'ERR', hits: 0, isBot: false, hasJsonLd: false, len: 0, err: e.message.slice(0, 50) }))
    req.on('timeout', () => { req.destroy(); resolve({ name: site.name, status: 'TIMEOUT', hits: 0, isBot: false, hasJsonLd: false, len: 0 }) })
  })
}

async function main() {
  console.log('\n🔍 Analizando portales...\n')
  const results = await Promise.all(sites.map(testSite))
  
  console.log('Portal            | Status | SSR hits | Bot? | JSON-LD | KB')
  console.log('─'.repeat(65))
  for (const r of results) {
    const bot = r.isBot ? '🚫 SÍ' : '✅ NO'
    const jld = r.hasJsonLd ? '✅' : '  '
    const kb = Math.round(r.len / 1024)
    const name = r.name.padEnd(17)
    const status = String(r.status).padEnd(6)
    const hits = String(r.hits).padEnd(8)
    console.log(`${name} | ${status} | ${hits} | ${bot}  | ${jld}    | ${kb}KB`)
  }
}

main()
