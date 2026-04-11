const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Seguir redirects manualmente y testear URLs corregidas
const sites = [
  { name: 'pisos.com',     url: 'https://www.pisos.com/venta/pisos-madrid/' },
  { name: 'gilmar',        url: 'https://www.gilmar.es/es/compra/pisos/madrid' },
  { name: 'gilmar2',       url: 'https://www.gilmar.es/es/compra' },
  { name: 'solvia',        url: 'https://www.solvia.es/es/comprar/pisos/madrid' },
  { name: 'remax',         url: 'https://www.remax.es/es/resultados?operacion=1&tipo=1' },
  { name: 'era',           url: 'https://www.era.es/es/comprar/pisos/madrid' },
  { name: 'donpiso',       url: 'https://www.donpiso.com/venta-pisos/madrid/madrid/' },
  { name: 'comprarcasa',   url: 'https://www.comprarcasa.com/pisos-en-venta/madrid/madrid/' },
  { name: 'urbadis',       url: 'https://www.urbadis.com/propiedades/pisos-en-venta-madrid/' },
  { name: 'properstar',    url: 'https://www.properstar.es/comprar/madrid/apartamento' },
  { name: 'idealista-ita', url: 'https://www.immobiliare.it' },  // control test
  { name: 'servihabitat',  url: 'https://www.servihabitat.com/comprar/pisos/Madrid' },
  { name: 'casaktua',      url: 'https://www.casaktua.com/comprar/pisos/madrid' },
  { name: 'anticipa',      url: 'https://www.anticipa.com/es/comprar/pisos/madrid' },
]

function testSite(site) {
  return new Promise((resolve) => {
    const u = new URL(site.url)
    const req = https.get(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,*/*',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      },
      (res) => {
        // Seguir redirect automáticamente (1 nivel)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ name: site.name, status: `→ ${res.headers.location.slice(0,50)}`, hits: 0, isBot: false, hasJsonLd: false, len: 0 })
          return
        }
        let body = ''
        res.on('data', (d) => { if (body.length < 80000) body += d })
        res.on('end', () => {
          const hits = (body.match(/precio|€|dormitor|m²|habitacion|property|inmueble/gi) || []).length
          const isBot = /captcha|datadom|cf-browser|are you human|robot check/i.test(body)
          const hasJsonLd = body.includes('application/ld+json')
          const hasPrices = (body.match(/\d{3,}\.?\d*\s*€|\d{2,}\s*m²/g) || []).length
          resolve({ name: site.name, status: res.statusCode, hits, hasPrices, isBot, hasJsonLd, len: body.length })
        })
      }
    )
    req.on('error', (e) => resolve({ name: site.name, status: 'ERR', hits: 0, hasPrices:0, isBot: false, hasJsonLd: false, len: 0, err: e.message.slice(0,50) }))
    req.on('timeout', () => { req.destroy(); resolve({ name: site.name, status: 'TIMEOUT', hits: 0, hasPrices:0, isBot: false, hasJsonLd: false, len: 0 }) })
  })
}

async function main() {
  console.log('\n🔍 Análisis de vulnerabilidad a scraping\n')
  const results = await Promise.all(sites.map(testSite))

  console.log('Portal            | Status | KW hits | Precios| Bot? | JSON-LD')
  console.log('─'.repeat(68))
  for (const r of results) {
    const bot = r.isBot ? '🚫' : '✅'
    const jld = r.hasJsonLd ? '✅' : '  '
    const name = r.name.padEnd(17)
    const status = String(r.status).padEnd(6)
    const hits = String(r.hits).padEnd(7)
    const prices = String(r.hasPrices||0).padEnd(6)
    console.log(`${name} | ${status} | ${hits} | ${prices} | ${bot}   | ${jld}`)
  }

  console.log('\n🏆 Mejores candidatos:')
  results
    .filter(r => r.status === 200 && !r.isBot && (r.hits > 10 || r.hasJsonLd))
    .sort((a, b) => b.hits - a.hits)
    .forEach(r => console.log(`  → ${r.name} (${r.hits} keywords, JSON-LD: ${r.hasJsonLd ? 'SÍ' : 'NO'})`))
}

main()
