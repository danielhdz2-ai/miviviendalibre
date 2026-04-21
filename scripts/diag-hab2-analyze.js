const fs = require('fs')
const path = require('path')

const listingHtml = fs.readFileSync(path.resolve(__dirname, 'hab2-listing.html'), 'utf8')
const detailHtml  = fs.readFileSync(path.resolve(__dirname, 'hab2-detail.html'),  'utf8')

console.log('\n=== LISTING PAGE ===')

// JSON-LD
const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
let m
let jldCount = 0
const jldData = []
while ((m = jsonLdRe.exec(listingHtml))) {
  jldCount++
  try {
    const obj = JSON.parse(m[1].trim())
    jldData.push(obj)
  } catch (e) {}
}
console.log('JSON-LD blocks:', jldCount)
if (jldData.length > 0) {
  const first = jldData[0]
  console.log('First JSON-LD type:', first['@type'])
  console.log('First JSON-LD keys:', Object.keys(first).join(', '))
  // If it's a list
  if (first['@type'] === 'ItemList' || first['itemListElement']) {
    const items = first['itemListElement'] || first
    console.log('ItemList elements:', Array.isArray(items) ? items.length : 'N/A')
    if (Array.isArray(items) && items[0]) console.log('First item:', JSON.stringify(items[0]).substring(0, 300))
  }
  if (first['@graph']) {
    console.log('@graph elements:', first['@graph'].length)
    first['@graph'].slice(0, 3).forEach((g, i) => {
      console.log(`  graph[${i}]: @type=${g['@type']}, keys=${Object.keys(g).join(', ')}`)
    })
  }
}

// Article elements
const articleMatches = listingHtml.match(/<article[^>]*>/gi) || []
console.log('\nArticle elements:', articleMatches.length)
if (articleMatches[0]) console.log('First article attrs (300):', articleMatches[0].substring(0, 300))

// Prices in listing
const priceMatches = listingHtml.match(/[\d.,]{3,10}\s*€/g) || []
const uniquePrices = [...new Set(priceMatches)].slice(0, 10)
console.log('\nPrice patterns found:', uniquePrices)

// Image CDNs
const allImgs = listingHtml.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi) || []
const imgDomains = {}
allImgs.forEach(url => {
  try { imgDomains[new URL(url).hostname] = (imgDomains[new URL(url).hostname] || 0) + 1 } catch {}
})
console.log('\nImage domains:', JSON.stringify(imgDomains))
// Show some habimg.com examples
const habImgs = allImgs.filter(u => u.includes('hab')).slice(0, 5)
console.log('Hab* image examples:', habImgs)

// Check for data-* attributes on article/li
const dataAttrs = listingHtml.match(/\bdata-(?:price|area|rooms|photo|image|href|url)[^=]*="[^"]{1,100}"/gi) || []
console.log('\nData attrs (first 10):', dataAttrs.slice(0, 10))

// Look for price near class names
const priceClass = listingHtml.match(/class="[^"]*price[^"]*"[^>]*>[^<]{1,50}/gi) || []
console.log('\nClass *price* content (first 5):', priceClass.slice(0, 5))

console.log('\n=== DETAIL PAGE ===')

// JSON-LD in detail
const detJsonRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
let detJld = []
while ((m = detJsonRe.exec(detailHtml))) {
  try { detJld.push(JSON.parse(m[1].trim())) } catch {}
}
console.log('Detail JSON-LD blocks:', detJld.length)
detJld.forEach((d, i) => {
  console.log(`  jld[${i}]: @type=${d['@type']}, keys=${Object.keys(d).join(', ')}`)
  if (d.offers) console.log('    offers:', JSON.stringify(d.offers).substring(0, 100))
  if (d.price)  console.log('    price:', d.price)
  if (d.image)  console.log('    image:', JSON.stringify(d.image).substring(0, 150))
})

// Detail images
const detImgs = detailHtml.match(/https?:\/\/[^"'\s<>]*hab[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi) || []
console.log('\nDetail hab* images (first 5):', [...new Set(detImgs)].slice(0, 5))

// Particular detection
console.log('\nisParticular check:')
console.log('  anunci de particular:', /anunci(?:o)?\s+de\s+particular/i.test(detailHtml))
console.log('  tipo de anunciante:', /tipo\s+de\s+anunciante/i.test(detailHtml))
const adTypeM = detailHtml.match(/tipo[^<]{0,20}anunciante[^<]{0,60}/i)
if (adTypeM) console.log('  advertiser type snippet:', adTypeM[0])
const partM = detailHtml.match(/particular[^<]{0,30}/gi)
if (partM) console.log('  particular snippets (first 3):', partM.slice(0, 3))

// Detail price
const detPriceMatches = detailHtml.match(/"price"\s*:\s*["']?(\d{4,9})["']?/gi) || []
console.log('\nDetail price JSON patterns:', detPriceMatches.slice(0, 5))
const detPriceEuro = detailHtml.match(/[\d.,]{3,10}\s*€/g) || []
console.log('Detail price € (first 5):', [...new Set(detPriceEuro)].slice(0, 5))
