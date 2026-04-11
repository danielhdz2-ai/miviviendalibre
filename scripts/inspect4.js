const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetchUrl(url, maxBytes=300000) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'text/html,application/json,*/*', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 15000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`
          fetchUrl(next).then(resolve); return
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
  console.log('=== PISOS.COM DETALLE ===')
  const r = await fetchUrl('https://www.pisos.com/comprar/piso-universidad_malasana28004-63412235710_528715/')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  // Ver TODOS los JSON-LD
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m, count = 0
  while ((m = regex.exec(r.body)) && count < 5) {
    try {
      const d = JSON.parse(m[1])
      const type = d['@type'] || (d['@graph'] ? 'Graph' : 'Unknown')
      console.log(`JSON-LD[${count}] @type: ${type}`)
      // Si tiene offers o price
      if (d.offers || d.price || d['@graph']) {
        console.log('  CONTENIDO:', JSON.stringify(d).slice(0, 600))
      }
      count++
    } catch {}
  }

  // Buscar precio y características en HTML
  const precios = r.body.match(/\d{1,3}(\.\d{3})+\s*€/g) || []
  const m2 = r.body.match(/\d+\s*m²/g) || []
  const habs = r.body.match(/\d+\s*(?:hab\.|habitacion|dormitor)/gi) || []
  console.log('\nPrecio en HTML:', [...new Set(precios)].slice(0, 3))
  console.log('M²:', [...new Set(m2)].slice(0, 3))
  console.log('Hab:', [...new Set(habs)].slice(0, 3))

  // Ver title y meta description del HTML
  const title = (r.body.match(/<title>([^<]+)<\/title>/) || [])[1]
  const desc = (r.body.match(/<meta name="description" content="([^"]+)"/) || [])[1]
  console.log('\nTitle:', title)
  console.log('Desc:', desc?.slice(0, 200))

  // Buscar precio en elementos HTML con clases comunes
  const priceInEl = r.body.match(/class="[^"]*(?:price|precio|importe)[^"]*"[^>]*>([^<]+)</gi) || []
  console.log('Price elements:', priceInEl.slice(0, 3))
}

async function checkGilmarBusquedas() {
  console.log('\n\n=== GILMAR /busquedas/ ===')
  const r = await fetchUrl('https://www.gilmar.es/busquedas/')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }
  console.log(`HTML bytes: ${r.body.length}`)

  const precios = r.body.match(/\d{1,3}(\.\d{3})+\s*€/g) || []
  console.log(`Precios: ${precios.length}`, precios.slice(0, 5))

  // URLs de anuncios individuales
  const slugs = new Set()
  let m
  const linkPattern = /href="(https?:\/\/www\.gilmar\.es\/(?:venta|alquiler)\/[^"#?]{10,100})"/g
  while ((m = linkPattern.exec(r.body)) && slugs.size < 20) slugs.add(m[1])
  console.log(`\nURLs anuncios: ${slugs.size}`, [...slugs].slice(0, 5))

  // Buscar si tiene JS renderizado o JSON data
  const hasReact = r.body.includes('_reactFiber') || r.body.includes('__react')
  const hasVue = r.body.includes('__vue') || r.body.includes('data-v-')
  const hasNextData = r.body.includes('__NEXT_DATA__')
  console.log('\nFramework:', { hasReact, hasVue, hasNextData, isWP: r.body.includes('wp-content') })

  // Buscar AJAX URL en el JS
  const ajaxUrls = r.body.match(/["']([^"']*wp-admin\/admin-ajax[^"']*)["']/g) || []
  console.log('AJAX refs:', ajaxUrls.slice(0, 3))

  // Buscar endpoint de search custom
  const searchEndpoints = r.body.match(/["'](\/wp-json\/[^"'?]{5,80})["']/g) || []
  console.log('WP REST endpoints in JS:', [...new Set(searchEndpoints)].slice(0, 10))

  // Ver si hay inmuebles en un JSON embebido
  const jsonInPage = r.body.match(/\[\s*\{\s*"(?:id|ref|precio|price)":[^}]{10,500}\}/g) || []
  console.log('JSON data embedded:', jsonInPage.length, jsonInPage.slice(0, 1).map(j => j.slice(0, 200)))
}

async function checkGilmarListingUrl() {
  console.log('\n\n=== GILMAR — Una propiedad individual ===')
  // Intentar URL típica de Gilmar (slug + ID)
  const candidates = [
    'https://www.gilmar.es/venta/piso-madrid-centro-1234/',
    'https://www.gilmar.es/inmueble/piso-madrid/',
    'https://www.gilmar.es/propiedad/piso-en-venta-madrid/',
  ]
  for (const u of candidates) {
    const r = await fetchUrl(u)
    console.log(`[${r.status}] ${u.split('/').slice(-2).join('/')}`)
  }
}

async function main() {
  await checkPisosComDetail()
  await checkGilmarBusquedas()
  await checkGilmarListingUrl()
}
main()
