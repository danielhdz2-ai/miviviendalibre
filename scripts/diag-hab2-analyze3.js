const fs = require('fs'), path = require('path')
const d = fs.readFileSync(path.resolve(__dirname,'hab2-detail.html'),'utf8')

// ALL images.habimg.com URLs
const cdnImgs = [...new Set(d.match(/\/\/images\.habimg\.com\/[^\s"'<>?]+/g)||[])]
console.log('CDN images.habimg.com (first 5):', cdnImgs.slice(0,5))

// foto.htm: extract UUID and ID from p param
const fotoRe = /\/foto\.htm\?p=([^&"]+)&(?:amp;)?imagen=([^&"]+\.jpg)/gi
let m
const extracted = []
while((m=fotoRe.exec(d))!==null){
  const pParam = m[1]
  const uuid = m[2]
  const id = pParam.split('-').pop()
  // id like "500004569622" -> codem="500", codinm="4569622"
  const codem = id.substring(0,3)
  const codinm = id.substring(3)
  extracted.push({uuid, cdnUrl:`https://images.habimg.com/imgh/${codem}-${codinm}/img_${uuid.replace('.jpg','G.jpg')}`})
}
const unique = [...new Set(extracted.map(e=>e.cdnUrl))]
console.log('\nConstructed CDN URLs from foto.htm (first 5):')
unique.slice(0,5).forEach(u=>console.log(' ',u))

// Article feature content (area, bedrooms)
const featureM = d.match(/class="[^"]*(?:feature|hab|bano|m2|surface|area|room)[^"]*"[^>]*>[^<]{1,50}/gi)||[]
console.log('\nFeature class snippets (first 5):',featureM.slice(0,5))

// Look for any habimg in detail
const allHabImgs = d.match(/https?:\/\/[^"'\s<>]*habimg[^"'\s<>]*/g)||[]
console.log('\nAll habimg in detail (first 5):',[...new Set(allHabImgs)].slice(0,5))

// Price from itemprop or class
const offerEls = d.match(/itemprop="price"[^>]*>[^<]{0,30}/g)||[]
console.log('\nitemprop price elements:',offerEls.slice(0,5))
const priceSpans = d.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*([0-9][^<]{0,20}€)/gi)||[]
console.log('\nprice spans:',priceSpans.slice(0,5))

// area/bedrooms from data attributes
const listingDataAttrs = d.match(/data-(?:area|rooms|baths|beds|surface)[^=]*="[^"]+"/gi)||[]
console.log('\ndata area/rooms attrs:',listingDataAttrs.slice(0,5))

// check for price in h1
const h1 = d.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i)
if(h1) console.log('\nh1 content (200):', h1[1].replace(/\s+/g,' ').substring(0,200))
