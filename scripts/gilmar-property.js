const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetchUrl(url, maxBytes=500000) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url) } catch(e) { resolve({ err: e.message }); return }
    const req = https.get(
      { hostname: u.hostname, path: u.pathname+u.search,
        headers: { 'User-Agent': ua, 'Accept': 'application/json', 'Accept-Language': 'es-ES,es;q=0.9', 'Accept-Encoding': 'identity' },
        timeout: 15000 },
      (res) => {
        let body = ''
        res.on('data', d => { if(body.length < maxBytes) body+=d })
        res.on('end', () => resolve({ status: res.statusCode, body, ct: res.headers['content-type'], total: res.headers['x-wp-total'], pages: res.headers['x-wp-totalpages'] }))
      }
    )
    req.on('error', e => resolve({ err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ err: 'TIMEOUT' }) })
  })
}

async function main() {
  console.log('=== GILMAR WP REST /property — Estructura de datos ===\n')

  // 1. Una sola property con todos los campos
  const r = await fetchUrl('https://www.gilmar.es/wp-json/wp/v2/property?per_page=3&page=1')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  console.log(`Total propiedades: ${r.total} | Páginas: ${r.pages}`)

  try {
    const items = JSON.parse(r.body)
    console.log(`\nItems en respuesta: ${items.length}`)

    if (items.length > 0) {
      const first = items[0]
      console.log('\n📋 TODOS LOS CAMPOS del primer item:')
      console.log(JSON.stringify(first, null, 2).slice(0, 3000))
    }
  } catch(e) { console.log('Parse error:', e.message, r.body.slice(0, 200)) }

  // 2. Probar con _fields para obtener solo lo que nos interesa
  console.log('\n\n--- Test con _fields seleccionados ---')
  const fieldsR = await fetchUrl('https://www.gilmar.es/wp-json/wp/v2/property?per_page=5&_fields=id,title,link,meta,acf,excerpt,featured_media&page=1')
  if (!fieldsR.err && fieldsR.status === 200) {
    try {
      const items = JSON.parse(fieldsR.body)
      for (const item of items) {
        console.log(`\n[${item.id}] ${item.title?.rendered}`)
        console.log('  link:', item.link)
        console.log('  meta keys:', item.meta ? Object.keys(item.meta) : 'none')
        console.log('  acf keys:', item.acf ? Object.keys(item.acf).slice(0, 20) : 'none')
        console.log('  excerpt:', item.excerpt?.rendered?.slice(0, 100))
      }
    } catch(e) { console.log('Error:', e.message) }
  }
}

main()
