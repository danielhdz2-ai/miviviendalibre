const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Ronda 3: URLs corregidas de los que redirigían + nuevos targets
const sites = [
  // Los que funcionaron en ronda 1 con URLs correctas
  { name: 'pisos.com',      url: 'https://www.pisos.com/venta/pisos-madrid/1/' },
  { name: 'donpiso',        url: 'https://www.donpiso.com/venta-pisos/madrid/madrid/' },
  // Corregidos tras redireccionamientos
  { name: 'gilmar',         url: 'https://www.gilmar.es/es/pisos-en-venta/madrid' },
  { name: 'anticipa',       url: 'https://anticipa.com/es/comprar/pisos/madrid' },
  { name: 'urbadis',        url: 'https://urbadis.com/propiedades/pisos-en-venta-madrid/' },
  // Agencias bancarias con mucho stock
  { name: 'haya-re',        url: 'https://www.haya.es/es/comprar/pisos/madrid' },
  { name: 'altamira',       url: 'https://www.altamirasre.com/es/comprar/pisos/madrid/' },
  { name: 'sareb',          url: 'https://www.sareb.es/particulares/buscar/?operation=buy&type=piso&province=28' },
  { name: 'certicalia',     url: 'https://www.certicalia.com/inmuebles-venta/madrid' },
  // Portales con enfoque de nicho
  { name: 'trovimap',       url: 'https://www.trovimap.com/comprar/madrid-capital/' },
  { name: 'fotocasa-dev',   url: 'https://developer.fotocasa.es' },  // API pública?
  { name: 'hogaria',        url: 'https://www.hogaria.net/comprar/pisos/madrid/' },
  { name: 'inmuebles10',    url: 'https://www.inmuebles10.com/pisos-en-venta-madrid.html' },
  { name: 'vibbo-inmob',    url: 'https://www.vibbo.com/inmobiliaria/pisos-venta-madrid' },
]

function follow(url, depth=0) {
  return new Promise((resolve) => {
    if (depth > 3) { resolve({ status: 'MAX_REDIRECT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0 }); return }
    const u = new URL(url)
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search, headers: { 'User-Agent': ua, Accept: 'text/html,*/*', 'Accept-Language': 'es-ES,es' }, timeout: 10000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          follow(next, depth+1).then(resolve)
          return
        }
        let body = ''
        res.on('data', d => { if(body.length<80000) body+=d })
        res.on('end', () => {
          const hits = (body.match(/precio|€|dormitor|m²|habitacion|property|inmueble/gi)||[]).length
          const hasPrices = (body.match(/[\d.]{3,}\s*€/g)||[]).length
          const isBot = /captcha|datadom|cf-browser|are you human|robot/i.test(body)
          const hasJsonLd = body.includes('application/ld+json')
          resolve({ status: res.statusCode, hits, hasPrices, isBot, hasJsonLd, len: body.length, finalUrl: url })
        })
      }
    )
    req.on('error', e => resolve({ status: 'ERR:'+e.message.slice(0,30), hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0 }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', hits:0, hasPrices:0, isBot:false, hasJsonLd:false, len:0 }) })
  })
}

async function main() {
  console.log('\n🔍 Ronda 3 — Portales y agencias con mucho stock\n')
  const results = await Promise.all(sites.map(async s => ({ name: s.name, ...(await follow(s.url)) })))

  console.log('Portal            | Status | KW hits | Precios | Bot? | JSON-LD')
  console.log('─'.repeat(65))
  for (const r of results) {
    const bot = r.isBot ? '🚫' : '✅ libre'
    const jld = r.hasJsonLd ? '✅' : '  '
    console.log(`${r.name.padEnd(17)} | ${String(r.status).padEnd(6)} | ${String(r.hits).padEnd(7)} | ${String(r.hasPrices).padEnd(7)} | ${bot.padEnd(8)} | ${jld}`)
  }

  console.log('\n🏆 Top scraperables (200 + sin bot + keywords > 5):')
  results
    .filter(r => r.status === 200 && !r.isBot && r.hits > 5)
    .sort((a,b) => b.hits - a.hits)
    .forEach(r => console.log(`  ★ ${r.name}: ${r.hits} keywords, ${r.hasPrices} precios en HTML, JSON-LD:${r.hasJsonLd}`))
}

main()
