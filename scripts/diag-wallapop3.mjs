/**
 * Diagnóstico Wallapop 3 — estructura exacta del __NEXT_DATA__
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const testUrl = 'https://es.wallapop.com/item/piso-en-alquiler-en-goya-en-madrid-1254488504'

const res = await fetch(testUrl, {
  headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'es-ES', Referer: 'https://es.wallapop.com/' },
  signal: AbortSignal.timeout(20000),
})
const html = await res.text()
const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
if (!nextMatch) { console.log('No __NEXT_DATA__'); process.exit(1) }

const nd = JSON.parse(nextMatch[1])
const item = nd?.props?.pageProps?.item

// Estructura de title
console.log('\n=== item.title ===')
console.log(JSON.stringify(item?.title, null, 2))

// Estructura de price
console.log('\n=== item.price ===')
console.log(JSON.stringify(item?.price, null, 2))

// Primera imagen
console.log('\n=== item.images[0] ===')
console.log(JSON.stringify(item?.images?.[0], null, 2))

// Seller / user info
console.log('\n=== itemSeller (top keys) ===')
const seller = nd?.props?.pageProps?.itemSeller
console.log(JSON.stringify(seller ? Object.keys(seller) : null))
console.log('type:', seller?.type)
console.log('isPro:', seller?.isPro ?? seller?.is_pro ?? seller?.pro_badge)

// Campos de características
console.log('\n=== item.extra_info / item.attributes (primeros 5) ===')
console.log(JSON.stringify((item?.extra_info ?? item?.attributes ?? []).slice(0, 5), null, 2))

// Otras props del item (top level)
console.log('\n=== item top-level keys ===')
console.log(Object.keys(item ?? {}).join(', '))
