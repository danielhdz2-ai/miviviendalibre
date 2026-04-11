const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Ronda final: APIs JSON internas + portales con URLs exactas verificadas
const sites = [
  // pisos.com confirmado — probar API interna
  { name: 'pisos.com listing', url: 'https://www.pisos.com/pisos/piso-en-venta-en-madrid-palacio/' },
  // APIs JSON de portales (muchos tienen endpoint interno no documentado)
  { name: 'pisos.com API',     url: 'https://www.pisos.com/api/properties?operation=1&propertyType=2&locationId=28079&page=1&pageSize=20' },
  { name: 'donpiso API',       url: 'https://www.donpiso.com/api/v1/properties?operation=sale&type=apartment&province=madrid&page=1' },
  // Agencias bancarias con stock masivo
  { name: 'haya correcto',     url: 'https://haya.es/comprar/pisos/madrid' },
  { name: 'solvia correcto',   url: 'https://www.solvia.es/es/comprar/viviendas?province=madrid' },
  { name: 'cerberus-alting',   url: 'https://alting.es/puntos-de-interes/venta-pisos/?localidad=madrid' },
  // Agencias independientes grandes
  { name: 'gilmar correcto',   url: 'https://www.gilmar.es/venta' },
  { name: 'coldwell',          url: 'https://www.coldwellbanker.es/propiedades/' },
  { name: 'sothebys',          url: 'https://www.sothebysrealty.es/eng/sales' },
  { name: 'lucas-fox',         url: 'https://www.lucasfox.es/propiedades/en-venta/' },
  // Niche
  { name: 'piso.io',           url: 'https://piso.io/venta/madrid' },
  { name: 'fotocasa-pro',      url: 'https://pro.fotocasa.es' },
  { name: 'nexitum',           url: 'https://www.nexitum.es/pisos-en-venta/madrid/' },
  { name: 'urbaniza',          url: 'https://www.urbaniza.com/venta/pisos/madrid/' },
]

function follow(url, depth=0) {
  return new Promise((resolve) => {
    if (depth > 4) { resolve({ status: 'MAX_REDIRECT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false }); return }
    let u
    try { u = new URL(url) } catch { resolve({ status: 'BAD_URL', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search, headers: { 'User-Agent': ua, Accept: 'text/html,application/json,*/*', 'Accept-Language': 'es-ES,es' }, timeout: 10000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          follow(next, depth+1).then(resolve)
          return
        }
        let body = ''
        res.on('data', d => { if(body.length<100000) body+=d })
        res.on('end', () => {
          const ct = res.headers['content-type'] || ''
          const isJson = ct.includes('json')
          const hits = (body.match(/precio|€|dormitor|m²|habitacion|property|inmueble/gi)||[]).length
          const hasPrices = (body.match(/[\d.]{4,}\s*€|"price":\s*\d+/g)||[]).length
          const isBot = /captcha|DataDome|cf-browser|are you human|robot check/i.test(body)
          const hasJsonLd = body.includes('application/ld+json')
          resolve({ status: res.statusCode, hits, hasPrices, isBot, hasJsonLd, len: body.length, isJson })
        })
      }
    )
    req.on('error', e => resolve({ status: 'ERR', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false, err: e.message.slice(0,40) }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false }) })
  })
}

async function main() {
  console.log('\n🔍 Ronda Final — Verificación detallada\n')
  const results = await Promise.all(sites.map(async s => ({ name: s.name, ...(await follow(s.url)) })))

  console.log('Portal              | St  | KW  | Prices | Bot? | JSON | Type')
  console.log('─'.repeat(70))
  for (const r of results) {
    const bot = r.isBot ? '🚫 BOT' : '✅ OK '
    const jld = r.hasJsonLd ? '✅' : '  '
    const type = r.isJson ? 'JSON API' : 'HTML'
    console.log(`${r.name.padEnd(19)} | ${String(r.status).padEnd(3)} | ${String(r.hits).padEnd(3)} | ${String(r.hasPrices).padEnd(6)} | ${bot} | ${jld}   | ${type}`)
  }

  console.log('\n✅ SCRAPERABLES sin bot:')
  results
    .filter(r => typeof r.status === 'number' && r.status < 400 && !r.isBot)
    .sort((a,b) => (b.hasPrices+b.hits) - (a.hasPrices+a.hits))
    .forEach(r => console.log(`  [${r.isJson?'API':'HTML'}] ${r.name}: ${r.hits} KW + ${r.hasPrices} precios en respuesta`))
}

main()
