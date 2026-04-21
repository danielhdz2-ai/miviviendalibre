const fs = require('fs')
const path = require('path')

const listingHtml = fs.readFileSync(path.resolve(__dirname, 'hab2-listing.html'), 'utf8')
const detailHtml  = fs.readFileSync(path.resolve(__dirname, 'hab2-detail.html'),  'utf8')

// ── Extract first article block
console.log('\n=== FIRST ARTICLE BLOCK (first 2000 chars) ===')
const artMatch = listingHtml.match(/<article[^>]*class="[^"]*list-item-container[^"]*"[^>]*>([\s\S]*?)<\/article>/)
if (artMatch) console.log(artMatch[0].substring(0, 2000))

// ── Extract price from itemprop=price in first article
console.log('\n=== ITEMPROP PRICE PATTERNS ===')
const itempriceM = listingHtml.match(/itemprop="price"[^>]*content="([^"]+)"/gi) || []
console.log(itempriceM.slice(0, 5))

// ── img src/data-src inside articles
console.log('\n=== IMG SRC/DATA-SRC in listing ===')
const imgSrcM = listingHtml.match(/data-src="([^"]+habimg[^"]+)"/gi) || []
console.log('data-src habimg:', imgSrcM.slice(0, 3))
const imgSrc2 = listingHtml.match(/src="([^"]+habimg[^"]+)"/gi) || []
console.log('src habimg:', imgSrc2.slice(0, 3))

// ── img within first article
const firstArtFull = listingHtml.match(/<article[^>]*id="id\d+"[^>]*>([\s\S]*?)<\/article>/)
if (firstArtFull) {
  const artHtml = firstArtFull[0]
  const imgInArt = artHtml.match(/<img[^>]+>/gi) || []
  console.log('\n=== IMGS IN FIRST ARTICLE ===')
  imgInArt.slice(0, 5).forEach(i => console.log(i.substring(0, 200)))
}

// ── Detail: "Particular" context
console.log('\n=== DETAIL "Particular" CONTEXT ===')
const idx = detailHtml.indexOf('Particular')
if (idx >= 0) {
  console.log('Context around "Particular" (500 chars):')
  console.log(detailHtml.substring(Math.max(0, idx - 150), idx + 350))
}

// ── Detail: find all "Particular" occurrences
const partRe = /[Pp]articular/g
let pm
const partContexts = []
while ((pm = partRe.exec(detailHtml)) !== null) {
  partContexts.push(detailHtml.substring(Math.max(0, pm.index - 80), pm.index + 80))
}
console.log('\n=== ALL Particular CONTEXTS ===')
partContexts.slice(0, 6).forEach((c, i) => console.log(`[${i}]`, c.replace(/\s+/g, ' ').trim()))

// ── Detail: foto.htm URL structure
console.log('\n=== DETAIL FOTO.HTM IMAGE URLS ===')
const fotoUrls = (detailHtml.match(/https?:\/\/www\.habitaclia\.com\/+foto\.htm[^"'\s<>]+/g) || []).slice(0, 3)
fotoUrls.forEach(u => console.log(decodeURIComponent(u).substring(0, 200)))

// ── Detect price in detail: look for meta og:price or itemscope
console.log('\n=== DETAIL PRICE DETECTION ===')
const ogPrice = detailHtml.match(/og:price[^>]*content="([^"]+)"/i)
console.log('og:price:', ogPrice ? ogPrice[1] : 'not found')
const itemPrice = detailHtml.match(/itemprop="price"[^>]*content="([^"]+)"/i)
console.log('itemprop price:', itemPrice ? itemPrice[1] : 'not found')
const metaPrice = detailHtml.match(/meta[^>]*(?:name|property)="(?:og:price|price)"[^>]*content="([^"]+)"/i)
console.log('meta price:', metaPrice ? metaPrice[1] : 'not found')
// Find price in h1/h2/heading context
const headingPrice = detailHtml.match(/<[hH][12][^>]*>[^<]*([0-9][0-9.,]{2,10}\s*€)[^<]*<\/[hH][12]>/i)
console.log('heading price:', headingPrice ? headingPrice[1] : 'not found')
// span with price
const spanPrices = detailHtml.match(/class="[^"]*price[^"]*"[^>]*>([^<]{3,30})</gi) || []
console.log('span.price (first 5):', spanPrices.slice(0, 5))
