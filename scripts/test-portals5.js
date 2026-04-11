const https = require('https')
const http  = require('http')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sites = [
  // Gilmar — agencia premium española, intentar sub-páginas con listados reales
  { name: 'gilmar /venta',        url: 'https://www.gilmar.es/venta' },
  { name: 'gilmar pisos madrid',  url: 'https://www.gilmar.es/venta/pisos-en-madrid' },
  { name: 'gilmar comprar',       url: 'https://www.gilmar.es/comprar' },
  { name: 'gilmar propiedades',   url: 'https://www.gilmar.es/propiedades' },
  { name: 'gilmar en-venta',      url: 'https://www.gilmar.es/en-venta' },
  { name: 'gilmar resultados',    url: 'https://www.gilmar.es/resultados?tipo=venta' },

  // pisos.com — URL real de listados (no la que probé antes)
  { name: 'pisos.com madrid p1',  url: 'https://www.pisos.com/venta/pisos-madrid/' },
  { name: 'pisos.com item',       url: 'https://www.pisos.com/piso/piso-en-venta-en-madrid-palacio/' },

  // Solvia — banco Banco Sabadell, miles de pisos
  { name: 'solvia listado',       url: 'https://www.solvia.es/es/comprar/viviendas?province=madrid' },
  { name: 'solvia API JSON',      url: 'https://www.solvia.es/api/properties?province=28&operation=sale&page=1' },

  // Lucas Fox — agencia lujo con API bien estructurada
  { name: 'lucasfox.com',         url: 'https://www.lucasfox.com/es/propiedades/en-venta/' },
  { name: 'lucasfox API feed',    url: 'https://www.lucasfox.com/api/properties?operation=sale&location=madrid&page=1' },

  // Coldwell Banker España
  { name: 'coldwell propiedades', url: 'https://www.coldwellbanker.es/todas-las-propiedades/' },
  { name: 'coldwell venta',       url: 'https://www.coldwellbanker.es/propiedades/venta/' },

  // Engel & Völkers
  { name: 'engelvoelkers',        url: 'https://www.engelvoelkers.com/es/search/?q=madrid&startIndex=0&pageSize=18&sortOrder=ASC&sortField=sortPrice&geocodeCountry=es&businessArea=residential&wGUID=&rsGUID=&categoryCode=&viewMode=list' },

  // Bankinter/Haya (banco con mucho REO)
  { name: 'haya.es',              url: 'https://www.haya.es/comprar/pisos-y-apartamentos/madrid/' },
  { name: 'haya API',             url: 'https://www.haya.es/api/v2/assets?province=madrid&type=apartment&operation=sale&page=1' },
]

function follow(url, depth=0, maxChars=150000) {
  return new Promise((resolve) => {
    if (depth > 5) { resolve({ status: 'MAX_REDIRECT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false }); return }
    let u
    try { u = new URL(url) } catch(e) { resolve({ status: 'BAD_URL', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false, err: e.message }); return }
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(
      { hostname: u.hostname, path: u.pathname+u.search, headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      }, timeout: 12000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          follow(next, depth+1).then(resolve)
          return
        }
        let body = ''
        res.on('data', d => { if(body.length < maxChars) body+=d })
        res.on('end', () => {
          const ct = res.headers['content-type'] || ''
          const isJson = ct.includes('json')
          const kw = (body.match(/precio|€|dormitor|m²|habitacion|property|inmueble|bedroom|bathroom|surface|price/gi)||[]).length
          const prices = (body.match(/[\d]{4,6}\s*€|"price":\s*[\d]+/g)||[]).length
          const isBot = /captcha|DataDome|cf-browser|are you human|robot check|checking your browser/i.test(body)
          const hasJsonLd = body.includes('application/ld+json')
          // Extract sample prices
          const priceSample = (body.match(/[\d]{4,6}\s*€/g)||[]).slice(0,5)
          resolve({ status: res.statusCode, hits:kw, hasPrices:prices, isBot, hasJsonLd, len: body.length, isJson, priceSample })
        })
      }
    )
    req.on('error', e => resolve({ status: 'ERR', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false, err: e.message.slice(0,50) }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0, isJson:false }) })
  })
}

async function main() {
  console.log('\n🔍 Round 5 — Agencias premium + portales con URLs corregidas\n')
  const results = await Promise.all(sites.map(async s => ({ name: s.name, ...(await follow(s.url)) })))

  console.log('Portal                    | St  | KW  | €   | Bot? | JSON-LD | Precios')
  console.log('─'.repeat(80))
  for (const r of results) {
    const bot = r.isBot ? '🚫BOT' : '✅   '
    const jld = r.hasJsonLd ? '✅' : '  '
    const prices = r.priceSample?.length ? r.priceSample.slice(0,3).join(', ') : '-'
    console.log(`${r.name.padEnd(25)} | ${String(r.status).padEnd(3)} | ${String(r.hits).padEnd(3)} | ${String(r.hasPrices).padEnd(3)} | ${bot} | ${jld}      | ${prices}`)
  }

  console.log('\n🏆 CANDIDATOS FUERTES (200, sin bot, con precios):')
  results
    .filter(r => typeof r.status === 'number' && r.status < 400 && !r.isBot && r.hasPrices > 0)
    .sort((a,b) => b.hasPrices - a.hasPrices)
    .forEach(r => console.log(`  ${r.hasJsonLd?'[JSON-LD]':'[HTML]   '} ${r.name}: ${r.hasPrices} precios, ${r.hits} KW`))

  console.log('\n📋 Con 200 OK sin bot (aunque sin precios):')
  results
    .filter(r => typeof r.status === 'number' && r.status < 400 && !r.isBot && r.hasPrices === 0)
    .forEach(r => console.log(`  ${r.name}: ${r.hits} KW, ${r.len} bytes`))
}

main()
