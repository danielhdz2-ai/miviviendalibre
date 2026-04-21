/**
 * Diagnóstico Wallapop 4 — realEstateInfo y características
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
const nd = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1])
const item = nd?.props?.pageProps?.item

console.log('\n=== item.realEstateInfo ===')
console.log(JSON.stringify(item?.realEstateInfo, null, 2))

console.log('\n=== item.characteristics ===')
console.log(JSON.stringify(item?.characteristics, null, 2))

console.log('\n=== item.characteristicsDetails ===')
console.log(JSON.stringify(item?.characteristicsDetails, null, 2))

console.log('\n=== item.typeAttributes ===')
console.log(JSON.stringify(item?.typeAttributes, null, 2))

console.log('\n=== item.location ===')
console.log(JSON.stringify(item?.location, null, 2))

console.log('\n=== item.flags ===')
console.log(JSON.stringify(item?.flags, null, 2))

console.log('\n=== itemSeller.sellerType ===')
const seller = nd?.props?.pageProps?.itemSeller
console.log('sellerType:', seller?.sellerType)
console.log('type:', seller?.type)
console.log('badgeType:', seller?.badgeType)
