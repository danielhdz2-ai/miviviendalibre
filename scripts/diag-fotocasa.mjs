/**
 * Diagnostica qué estructura de datos usa Fotocasa ahora (sin __NEXT_DATA__)
 * Intercepta llamadas a la API Gateway y busca datos en el DOM.
 */
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
chromium.use(StealthPlugin())

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const URL = 'https://www.fotocasa.es/es/comprar/viviendas/madrid-capital/todas-las-zonas/l?commercial=0'

/**
 * Diagnóstico de página de detalle de Habitaclia
 */
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
chromium.use(StealthPlugin())

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const DETAIL_URL = 'https://www.habitaclia.com/comprar-piso-la_paz_calle_de_fermin_caballero_de_fermin_caballero_3_la_paz-madrid-i500004572403.htm'

const br = await chromium.launch({ headless: true })
const ctx = await br.newContext({ userAgent: UA, locale: 'es-ES', viewport: { width: 1366, height: 768 } })
const pg = await ctx.newPage()

console.log('Navigating to Habitaclia detail...')
await pg.goto(DETAIL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
await pg.waitForTimeout(2000)

const data = await pg.evaluate(() => {
  const body = document.body.innerHTML
  const text = document.body.innerText

  // Buscar CDN de imágenes
  const imgSrcs = [...document.querySelectorAll('img')].map(i => i.src || i.dataset.src || '').filter(Boolean)
  const cdnImgs = imgSrcs.filter(s => s.includes('habimg') || s.includes('habitaclia'))

  // Buscar enlaces a imágenes en el HTML (todos los CDN usados)
  const imgUrlMatches = [...body.matchAll(/https?:\/\/[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi)].map(m => m[0])
  const uniqueImgDomains = [...new Set(imgUrlMatches.map(u => new URL(u).hostname))]

  // Detectar si hay texto de "particular"
  const particularMatches = [...text.matchAll(/particular/gi)].map(m => {
    const start = Math.max(0, m.index - 50)
    const end = Math.min(text.length, m.index + 80)
    return text.slice(start, end).trim()
  })

  // Precio en la página
  const priceMatch = text.match(/([\d.]{4,})\s*€/)
  
  // Primeros 1500 chars del texto
  const snippet = text.slice(0, 1500)

  return { cdnImgs: cdnImgs.slice(0, 5), uniqueImgDomains, imgUrlSample: imgUrlMatches.slice(0, 5), 
    particularMatches: particularMatches.slice(0, 6), priceMatch: priceMatch?.[0], snippet }
})

console.log('CDN images:', data.cdnImgs)
console.log('Image domains:', data.uniqueImgDomains)
console.log('Image URLs sample:', data.imgUrlSample)
console.log('Particular mentions:', data.particularMatches)
console.log('Price match:', data.priceMatch)
console.log('\nSnippet:')
console.log(data.snippet)

await br.close()

