const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetch(url, maxBytes=250000) {
  return new Promise((resolve) => {
    let u
    try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'text/html,*/*', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 12000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          fetch(next).then(resolve); return
        }
        let body = ''
        res.on('data', d => { if(body.length < maxBytes) body+=d })
        res.on('end', () => resolve({ status: res.statusCode, body }))
      }
    )
    req.on('error', e => resolve({ err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ err: 'TIMEOUT' }) })
  })
}

async function inspectPisosCom() {
  console.log('\n🔍 PISOS.COM — Inspección profunda\n')

  // 1. Obtener todos los JSON-LD de la página de listados
  const r = await fetch('https://www.pisos.com/venta/pisos-madrid/')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  // Extraer todos los JSON-LD
  const jsonLdBlocks = []
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = regex.exec(r.body))) {
    try { jsonLdBlocks.push(JSON.parse(m[1])) } catch {}
  }
  console.log(`JSON-LD blocks found: ${jsonLdBlocks.length}`)
  for (const b of jsonLdBlocks.slice(0,10)) {
    console.log(`  @type: ${b['@type']}`)
    if (b['@type'] === 'SingleFamilyResidence' || b['@type'] === 'Apartment' || b['@type'] === 'RealEstateListing') {
      console.log('  FULL DATA:', JSON.stringify(b, null, 2).slice(0, 800))
    }
  }

  // Extraer URLs de anuncios individuales
  const slugPattern = /href="(\/comprar\/[^"]+)"|href="(\/piso\/[^"]+)"/g
  const urls = new Set()
  while ((m = slugPattern.exec(r.body)) && urls.size < 20) urls.add(m[1]||m[2])
  console.log(`\n📋 URLs anuncios encontradas: ${urls.size}`)
  const firstUrls = [...urls].slice(0, 5)
  console.log(firstUrls)

  // Visitar primera URL de anuncio y extraer JSON-LD completo
  if (firstUrls.length > 0) {
    const detailUrl = firstUrls[0].startsWith('http') ? firstUrls[0] : `https://www.pisos.com${firstUrls[0]}`
    console.log(`\n🏠 Visitando detalle: ${detailUrl}`)
    const dr = await fetch(detailUrl)
    if (!dr.err && dr.status === 200) {
      const detailRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
      let dm
      while ((dm = detailRegex.exec(dr.body))) {
        try {
          const d = JSON.parse(dm[1])
          if (d['@type'] && ['Apartment', 'SingleFamilyResidence', 'RealEstateListing', 'House', 'Residence'].includes(d['@type'])) {
            console.log('\n✅ DETALLE JSON-LD completo:')
            console.log(JSON.stringify(d, null, 2).slice(0, 1500))
          }
        } catch {}
      }
    } else { console.log('Error detalle:', dr.err || dr.status) }
  }
}

async function inspectGilmar() {
  console.log('\n🔍 GILMAR — Inspección profunda\n')

  const r = await fetch('https://www.gilmar.es/comprar')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  // Extraer URLs de listados individuales Gilmar
  const patterns = [
    /href="(\/inmueble\/[^"]+)"/g,
    /href="(\/propiedad\/[^"]+)"/g,
    /href="(\/ficha\/[^"]+)"/g,
    /href="(https:\/\/www\.gilmar\.es\/[a-z-]+-[0-9]+[^"]*)"/g,
    /href="(\/[a-z0-9-]+-en-[a-z-]+-\d+[^"]*)"/g,
    // Gilmar suele usar slugs como /comprar/apartamento-barrio-ID
    /href="([^"]*\/comprar\/[^"]+)"/g,
    /"url":"(https:\/\/www\.gilmar\.es\/[^"]+)"/g,
  ]

  const urls = new Set()
  let m
  for (const p of patterns) {
    while ((m = p.exec(r.body)) && urls.size < 30) {
      const url = m[1]
      if (url && url.length > 5 && !url.includes('?') && url !== '/comprar') urls.add(url)
    }
  }
  console.log(`URLs encontradas: ${urls.size}`)
  console.log([...urls].slice(0, 15))

  // Ver JSON-LD
  const jsonLdBlocks = []
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  while ((m = regex.exec(r.body))) {
    try { jsonLdBlocks.push(JSON.parse(m[1])) } catch {}
  }
  console.log(`\nJSON-LD blocks: ${jsonLdBlocks.length}`)
  for (const b of jsonLdBlocks) {
    console.log(`  @type: ${JSON.stringify(b).slice(0, 200)}`)
  }

  // Buscar patrones de URL en el HTML
  const allHrefs = []
  const hrefRegex = /href="([^"]{10,100})"/g
  while ((m = hrefRegex.exec(r.body)) && allHrefs.length < 100) {
    const h = m[1]
    // Solo URLs que parezcan anuncios
    if (/\d{4,}/.test(h) || /\/venta\//.test(h) || /\/alquiler\//.test(h)) {
      allHrefs.push(h)
    }
  }
  console.log(`\n🔗 HREFs con números/venta/alquiler: ${allHrefs.length}`)
  console.log(allHrefs.slice(0, 20))
}

async function main() {
  await inspectPisosCom()
  await inspectGilmar()
}
main()
