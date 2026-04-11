const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Inspeccionar HTML real de los candidatos para entender estructura
const targets = [
  { name: 'gilmar-comprar',   url: 'https://www.gilmar.es/comprar' },
  { name: 'pisos-madrid',     url: 'https://www.pisos.com/venta/pisos-madrid/' },
  { name: 'engelvoelkers',    url: 'https://www.engelvoelkers.com/es-es/search/?q=madrid&startIndex=0&pageSize=18&sortOrder=ASC&sortField=sortPrice&geocodeCountry=es&businessArea=residential' },
]

function fetch(url) {
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
        res.on('data', d => { if(body.length < 200000) body+=d })
        res.on('end', () => resolve({ status: res.statusCode, body }))
      }
    )
    req.on('error', e => resolve({ err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ err: 'TIMEOUT' }) })
  })
}

function analyze(name, body) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`📄 ${name} (${body.length} bytes)`)
  console.log('═'.repeat(60))

  // Precios formato español: 100.000 € o 100.000€
  const precios_es = body.match(/\d{1,3}(\.\d{3})+\s*€/g) || []
  console.log(`\n💶 Precios (formato español) [${precios_es.length}]:`, precios_es.slice(0,10))

  // Precios formato json
  const precios_json = body.match(/"price":\s*[\d.]+/g) || []
  console.log(`💶 Precios (JSON) [${precios_json.length}]:`, precios_json.slice(0,10))

  // Metros cuadrados
  const metros = body.match(/\d+\s*m²|\d+\s*m2/g) || []
  console.log(`📐 Metros [${metros.length}]:`, metros.slice(0,6))

  // JSON-LD completo (primer bloque)
  const jsonLdMatch = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      console.log(`\n📦 JSON-LD tipo: ${data['@type']}`)
      if (data['@type'] === 'ItemList' || data['itemListElement']) {
        console.log(`   Items: ${(data.itemListElement||[]).length}`)
        const first = (data.itemListElement||[])[0]
        if (first) console.log(`   Primer item:`, JSON.stringify(first).slice(0,300))
      } else {
        console.log(`   Data:`, JSON.stringify(data).slice(0,400))
      }
    } catch(e) { console.log(`   ⚠️ JSON-LD parse error: ${e.message}`) }
  }

  // Buscar URLs de anuncios individuales
  const listingUrls = []
  const urlPatterns = [
    /href="([^"]*\/(?:piso|vivienda|inmueble|property|anuncio|propiedad|apartamento|casa)[^"]+)"/gi,
    /href="(https?:\/\/[^"]*\/(?:piso|vivienda|inmueble|property)[^"]+)"/gi,
  ]
  for (const p of urlPatterns) {
    let m
    while ((m = p.exec(body)) && listingUrls.length < 10) {
      if (!listingUrls.includes(m[1])) listingUrls.push(m[1])
    }
  }
  console.log(`\n🔗 URLs de anuncios encontradas [${listingUrls.length}]:`, listingUrls.slice(0,5))

  // Detectar si hay next-data (Next.js)
  if (body.includes('__NEXT_DATA__')) {
    const match = body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (match) {
      try {
        const nd = JSON.parse(match[1])
        const props = nd.props?.pageProps
        const keys = props ? Object.keys(props) : []
        console.log(`\n⚡ Next.js __NEXT_DATA__ keys: ${keys.join(', ')}`)
        // Buscar arrays de listings en pageProps
        for (const k of keys) {
          if (Array.isArray(props[k]) && props[k].length > 0) {
            console.log(`   Array "${k}": ${props[k].length} items, first: ${JSON.stringify(props[k][0]).slice(0,200)}`)
          }
        }
      } catch(e) { console.log(`   ⚠️ NEXT_DATA parse error: ${e.message}`) }
    }
  }

  // Detectar Nuxt/Vue
  if (body.includes('window.__NUXT__') || body.includes('__NUXT_DATA__')) {
    console.log('\n⚡ Nuxt.js detectado (SSR con __NUXT__ state)')
  }

  // Detectar si realmente hay contenido o es shell SPA
  const hasRealContent = body.includes('dormitori') || body.includes('habitaci') || body.includes('precio') || precios_es.length > 0
  console.log(`\n🎯 Contenido real: ${hasRealContent ? '✅ SSR' : '❌ Posible SPA (requiere JS)'}`)
}

async function main() {
  for (const t of targets) {
    const r = await fetch(t.url)
    if (r.err) { console.log(`\n❌ ${t.name}: ${r.err}`); continue }
    if (r.status !== 200) { console.log(`\n⚠️ ${t.name}: HTTP ${r.status}`); continue }
    analyze(t.name, r.body)
  }
}

main()
