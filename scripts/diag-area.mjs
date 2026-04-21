// Diagnóstico: qué patrones m² hay realmente en la página de detalle de Habitaclia
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { writeFileSync } from 'fs'

chromium.use(StealthPlugin())

const URL = 'https://www.habitaclia.com/comprar-piso-impresionante_piso_con_ubicacion_unica_en_madrid-madrid-i500004521959.htm'

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'es-ES',
})
const page = await ctx.newPage()
await page.goto('https://www.habitaclia.com/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(3000)
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 })
await page.waitForTimeout(2000)
const html = await page.content()
await browser.close()

// Guardar HTML para inspección manual si hace falta
writeFileSync('scripts/diag-area-detail.html', html)

// Mostrar TODOS los contextos donde aparece m²
const allM2 = []
const re = /(.{0,60}\d+\s*m[²2].{0,60})/gi
let m
while ((m = re.exec(html)) !== null && allM2.length < 30) {
  allM2.push(m[1].replace(/\s+/g, ' ').trim())
}
console.log('\n=== TODOS LOS CONTEXTOS m² (máx 30) ===')
allM2.forEach((s, i) => console.log(`[${i}] ${s}`))

// Buscar "Superficie"
const sfIdx = html.search(/[Ss]uperficie/)
if (sfIdx >= 0) {
  console.log('\n=== CONTEXTO "Superficie" ===')
  console.log(html.substring(sfIdx - 50, sfIdx + 500).replace(/\s+/g, ' '))
}

// Buscar el bloque de stats (precio · m² · hab)
const statsRe = /[\d.,]+\s*€[^<]{0,200}m[²2]/gi
const statsHits = []
while ((m = statsRe.exec(html)) !== null && statsHits.length < 5) {
  statsHits.push(m[0].substring(0, 120).replace(/\s+/g, ' '))
}
console.log('\n=== BLOQUE STATS (€ ... m²) ===')
statsHits.forEach((s, i) => console.log(`[${i}] ${s}`))

// Buscar data-area o similar
const dataAreaHits = html.match(/data-(?:area|surface|m2|metros)[^"]{0,100}/gi) ?? []
console.log('\n=== data-area / data-surface attrs ===', dataAreaHits.slice(0, 5))

// Buscar itemprop floorSize
const floorHits = html.match(/itemprop="[^"]*(?:floor|area|size)[^"]*"[^>]{0,100}/gi) ?? []
console.log('\n=== itemprop floor/area/size ===', floorHits.slice(0, 5))
