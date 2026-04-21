/**
 * Diagnóstico Wallapop — test de fetchDetail
 * Toma la primera URL de la lista y muestra qué parsea
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const testUrl = 'https://es.wallapop.com/item/piso-en-alquiler-en-goya-en-madrid-1254488504'

console.log(`\n🔍 Fetching: ${testUrl}\n`)

const res = await fetch(testUrl, {
  headers: {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
    Referer: 'https://es.wallapop.com/',
  },
  signal: AbortSignal.timeout(20000),
})

console.log(`HTTP: ${res.status} ${res.statusText}`)
const html = await res.text()
console.log(`Tamaño HTML: ${html.length} bytes`)

// Buscar JSON-LD
const jldMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
console.log(`\nJSON-LD blocks encontrados: ${jldMatches.length}`)
for (const block of jldMatches) {
  try {
    const j = JSON.parse(block[1])
    console.log(`  @type: ${j['@type']}, name: ${j.name?.slice(0, 50)}, price: ${j.offers?.price}`)
  } catch (e) {
    console.log(`  ❌ Error parseando JSON-LD: ${e}`)
  }
}

// Buscar __NEXT_DATA__
const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
if (nextMatch) {
  console.log(`\n__NEXT_DATA__ encontrado (${nextMatch[1].length} chars)`)
  try {
    const nd = JSON.parse(nextMatch[1])
    const pageProps = nd?.props?.pageProps
    console.log(`  pageProps keys: ${Object.keys(pageProps ?? {}).join(', ')}`)
    const item = pageProps?.itemDetail ?? pageProps?.item ?? pageProps?.initialState?.itemDetail
    if (item) {
      console.log(`\n  Item encontrado:`)
      console.log(`    title: ${item.title ?? item.name}`)
      console.log(`    price: ${JSON.stringify(item.sale_price ?? item.price)}`)
      console.log(`    location: ${JSON.stringify(item.location)}`)
      console.log(`    images count: ${item.images?.length ?? 0}`)
      console.log(`    extra_info: ${JSON.stringify((item.extra_info ?? item.attributes ?? []).slice(0, 3))}`)
    } else {
      console.log(`  ⚠️ No se encontró item en pageProps`)
      console.log(`  pageProps completo: ${JSON.stringify(pageProps)?.slice(0, 500)}`)
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e}`)
  }
} else {
  console.log(`\n⚠️ No __NEXT_DATA__ encontrado`)
  // Buscar title y precio en HTML plano
  const h1 = html.match(/<h1[^>]*>([\s\S]{3,150}?)<\/h1>/)
  const priceM = html.match(/(\d{2,7})\s*€/)
  console.log(`  H1: ${h1?.[1]?.slice(0, 80)}`)
  console.log(`  Precio: ${priceM?.[1]}`)
  console.log(`  HTML snippet (500 chars): ${html.slice(0, 500)}`)
}
