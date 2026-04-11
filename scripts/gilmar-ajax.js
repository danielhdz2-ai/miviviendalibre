const https = require('https')

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function fetchUrl(url, maxBytes=400000) {
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

async function analyzeGilmarJS() {
  console.log('=== GILMAR /busquedas/ — Análisis JS/AJAX ===\n')
  const r = await fetchUrl('https://www.gilmar.es/busquedas/')
  if (r.err || r.status !== 200) { console.log('Error:', r.err || r.status); return }

  // Buscar referencias al acción AJAX
  const ajaxActions = r.body.match(/action['"]\s*[:=]\s*['"]([a-z_]+)['"]/gi) || []
  console.log('AJAX actions:', ajaxActions.slice(0, 10))

  // Buscar nombres de acciones AJAX en jQuery.ajax o fetch calls
  const ajaxPatterns = [
    /ajax_action['"]\s*[:=]\s*['"]([^'"]+)['"]/g,
    /action:\s*['"]([a-z_]+)['"]/g,
    /'action'\s*:\s*'([^']+)'/g,
    /"action"\s*:\s*"([^"]+)"/g,
  ]
  const actions = new Set()
  for (const p of ajaxPatterns) {
    let m
    while ((m = p.exec(r.body))) actions.add(m[1])
  }
  console.log('All actions found:', [...actions])

  // Buscar scripts externos cargados
  const scripts = r.body.match(/<script[^>]*src="([^"]+gilmar[^"]+)"[^>]*>/gi) || []
  console.log('\nScripts propios:', scripts.slice(0, 8))

  // Buscar nonce/security tokens (needed for AJAX)
  const nonces = r.body.match(/nonce['"]\s*:\s*['"]([a-f0-9]+)['"]/gi) || []
  const securities = r.body.match(/security['"]\s*:\s*['"]([a-f0-9]+)['"]/gi) || []
  console.log('Nonces:', nonces.slice(0, 3))
  console.log('Security:', securities.slice(0, 3))

  // Buscar variables JS con datos de búsqueda
  const varMatches = r.body.match(/var\s+\w+\s*=\s*\{[^}]{20,500}\}/g) || []
  console.log('\nVar assignments:', varMatches.slice(0, 5).map(v => v.slice(0, 200)))

  // CRITICAL: buscar wp_localize_script data
  const localizedData = r.body.match(/var\s+\w+\s*=\s*\{\s*["']ajax_url["']/g) || []
  console.log('Localized data:', localizedData.slice(0, 5))

  // Buscar JSON embebido que pueda contener propiedades
  // WordPress suele embeber datos con window.property_data = {...}
  const windowData = r.body.match(/window\.[a-z_]+\s*=\s*(\{[\s\S]{20,2000}?\})/gi) || []
  console.log('\nWindow data:', windowData.slice(0, 3).map(d => d.slice(0, 300)))

  // Ver si hay un endpoint REST personalizado en los scripts
  const restBase = r.body.match(/rest_url['"]\s*:\s*['"]([^'"]+)['"]/gi) || []
  console.log('REST URLs:', restBase.slice(0, 3))

  // Buscar todas las URLs de JS external que podrían ser el search engine
  const allScripts = r.body.match(/src="(https?:\/\/[^"]+\.js[^"]*)"/g) || []
  console.log('\nTodos los scripts externos:', allScripts.slice(0, 6))
}

async function testGilmarAjax() {
  console.log('\n\n=== GILMAR AJAX POST test ===\n')
  const body = 'action=filter_search&operation=venta&location=madrid&page=1'
  const actions = [
    'filter_search',
    'search_properties',
    'load_more_properties',
    'buscar_inmuebles',
    'get_properties',
    'busqueda',
  ]

  for (const action of actions.slice(0, 3)) {
    const postBody = `action=${action}&operation=venta&location=madrid&page=1`
    const result = await new Promise((resolve) => {
      const req = https.request(
        { hostname: 'www.gilmar.es', path: '/wp-admin/admin-ajax.php',
          method: 'POST',
          headers: {
            'User-Agent': ua, 'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postBody),
          },
          timeout: 10000
        },
        (res) => {
          let body = ''
          res.on('data', d => { if(body.length<10000) body+=d })
          res.on('end', () => resolve({ status: res.statusCode, body }))
        }
      )
      req.on('error', e => resolve({ err: e.message }))
      req.write(postBody); req.end()
    })
    console.log(`action=${action}: [${result.status}] ${(result.body||result.err||'').slice(0, 150)}`)
  }
}

async function main() {
  await analyzeGilmarJS()
  await testGilmarAjax()
}
main()
