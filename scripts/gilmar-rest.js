const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetchUrl(url, maxBytes=300000) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'application/json,text/html,*/*', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 12000 },
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

async function main() {
  console.log('=== GILMAR WP REST API — Todos los post types ===\n')

  // 1. Ver todos los post types registrados
  const typesR = await fetchUrl('https://www.gilmar.es/wp-json/wp/v2/types')
  if (!typesR.err && typesR.status === 200) {
    try {
      const types = JSON.parse(typesR.body)
      console.log('Post types disponibles:')
      for (const [key, val] of Object.entries(types)) {
        console.log(`  ${key}: rest_base="${val.rest_base || key}"`)
      }
    } catch(e) { console.log('Error parsing types:', e.message) }
  }

  // 2. Probar endpoints de post types comunes (nombre + plurales)
  const candidates = ['inmuebles','inmueble','propiedades','propiedad','properties','property','pisos','piso','listings','listing','viviendas','vivienda','activos','activo']
  console.log('\n--- Probando endpoints de post types ---')
  for (const c of candidates) {
    const r = await fetchUrl(`https://www.gilmar.es/wp-json/wp/v2/${c}?per_page=1`)
    if (!r.err && r.status === 200) {
      try {
        const d = JSON.parse(r.body)
        if (Array.isArray(d) && d.length > 0) {
          const first = d[0]
          console.log(`✅ /${c}: ${d.length} items, keys: ${Object.keys(first).slice(0, 10).join(', ')}`)
          console.log(`   title: ${first.title?.rendered || first.slug || JSON.stringify(first).slice(0,100)}`)
        } else {
          console.log(`  [200] /${c}: ${JSON.stringify(d).slice(0, 80)}`)
        }
      } catch { console.log(`  [200-html] /${c}`) }
    } else if (!r.err && r.status !== 404) {
      console.log(`  [${r.status}] /${c}`)
    }
  }

  // 3. Probar búsqueda global WP
  console.log('\n--- WP Search ---')
  const searchR = await fetchUrl('https://www.gilmar.es/wp-json/wp/v2/search?search=piso+madrid&per_page=5')
  if (!searchR.err && searchR.status === 200) {
    try {
      const d = JSON.parse(searchR.body)
      console.log(`WP Search results: ${d.length}`)
      d.slice(0,3).forEach(i => console.log(`  type=${i.type} subtype=${i.subtype} title="${i.title}" url="${i.url?.slice(0,80)}"`)  )
    } catch(e) { console.log('Error:', e.message) }
  } else {
    console.log('Search error:', searchR.err || searchR.status)
  }

  // 4. Check wp-rest-filter specific endpoint
  console.log('\n--- wp-rest-filter plugin endpoints ---')
  const filterCandidates = [
    'https://www.gilmar.es/wp-json/?search=piso',
    'https://www.gilmar.es/wp-json/wp-rest-filter/v1/',
    'https://www.gilmar.es/wp-json/wp/v2/posts?filter[post_type]=inmueble&per_page=5',
  ]
  for (const u of filterCandidates) {
    const r = await fetchUrl(u)
    console.log(`[${r.status}] ${u.split('/').slice(-3).join('/')}: ${(r.body||'').slice(0,150)}`)
  }
}

main()
