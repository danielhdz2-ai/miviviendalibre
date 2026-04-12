// Debug: inspect pisos.com particulares page structure
async function run() {
  const url = 'https://www.pisos.com/alquiler/pisos-madrid/particulares/'
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    }
  }).then(r => r.text())

  // Count total pisos.com hrefs
  const allHrefs = [...html.matchAll(/href="(https?:\/\/(?:www\.)?pisos\.com[^"]+)"/gi)].map(m => m[1])
  console.log('Total pisos.com hrefs:', allHrefs.length)

  // Find listing detail URLs
  const listingHrefs = allHrefs.filter(u => u.includes('/alquilar/') || u.includes('/comprar/'))
  console.log('Listing hrefs (alquilar/comprar):', listingHrefs.length)
  listingHrefs.slice(0, 5).forEach(u => console.log(' -', u))

  // Try numeric ID pattern
  const numericPattern = allHrefs.filter(u => /\d{8,}_\d{4,}/.test(u))
  console.log('\nNumeric ID pattern matches:', numericPattern.length)
  numericPattern.slice(0, 3).forEach(u => console.log(' -', u))

  // Check JSON-LD
  const ldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  console.log('\nJSON-LD blocks:', ldBlocks.length)
  for (const b of ldBlocks.slice(0, 3)) {
    try {
      const d = JSON.parse(b[1])
      console.log(' └ @type:', d['@type'], d.url ? `url: ${d.url.slice(0,60)}` : '')
    } catch { /* */ }
  }

  // Check relative hrefs
  const relHrefs = [...html.matchAll(/href="(\/(?:alquilar|comprar)\/[^"]+)"/gi)].map(m => m[1])
  console.log('\nRelative listing hrefs:', relHrefs.length)
  relHrefs.slice(0, 3).forEach(u => console.log(' -', u))
}
run().catch(console.error)
