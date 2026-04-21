/**
 * Diagnóstico Habitaclia — guarda HTML de listado y primer detalle
 * Uso: node scripts/diag-hab2.mjs [venta|alquiler]
 */
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

chromium.use(StealthPlugin())

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const op = process.argv[2] ?? 'venta'
const LISTING_URL = op === 'alquiler'
  ? 'https://www.habitaclia.com/alquiler-piso_particular-madrid.htm'
  : 'https://www.habitaclia.com/viviendas-particulares-madrid.htm'

const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] })
const context = await browser.newContext({
  userAgent: UA,
  locale: 'es-ES',
  viewport: { width: 1366, height: 768 },
  extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' },
})

// Pre-warm + listing en la MISMA página (historial natural, sin nueva pestaña)
console.log('Pre-warming home...')
const listPage = await context.newPage()
await listPage.goto('https://www.habitaclia.com/', { waitUntil: 'domcontentloaded', timeout: 25000 })
await listPage.mouse.move(400, 300, { steps: 15 })
await listPage.waitForTimeout(800)
await listPage.mouse.move(600, 400, { steps: 10 })
await listPage.waitForTimeout(600)
await listPage.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }))
await listPage.waitForTimeout(4000)
console.log('Pre-warm done, navigating to listing...')

// Navegar al listado DESDE la misma página (Referer natural = home)
await listPage.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
await listPage.waitForTimeout(2000)
const listHtml = await listPage.content()

if (listHtml.includes('Pardon Our Interruption')) {
  console.error('❌ Imperva block en listing page')
  writeFileSync(resolve('scripts/hab2-listing-imperva.html'), listHtml)
  await browser.close()
  process.exit(1)
}

writeFileSync(resolve('scripts/hab2-listing.html'), listHtml)
console.log(`✅ Listing HTML guardado (${listHtml.length} bytes)`)

// Extract first detail URL
const linkRe = /href="((?:https?:\/\/www\.habitaclia\.com)?\/(?:comprar|alquiler)-[^"#\s]*-i\d{8,}\.htm)[^"]*"/gi
const firstMatch = linkRe.exec(listHtml)
if (!firstMatch) {
  console.error('❌ No se encontraron links en el listado')
  await listPage.close()
  await browser.close()
  process.exit(1)
}
const detailRelUrl = firstMatch[1]
const detailUrl = detailRelUrl.startsWith('http') ? detailRelUrl : `https://www.habitaclia.com${detailRelUrl}`
await listPage.close()

console.log(`Fetching detail: ${detailUrl}`)
await new Promise(r => setTimeout(r, 2500))
const detailPage = await context.newPage()
await detailPage.setExtraHTTPHeaders({ Referer: LISTING_URL })
await detailPage.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await detailPage.waitForTimeout(2000)
const detailHtml = await detailPage.content()

if (detailHtml.includes('Pardon Our Interruption')) {
  console.warn('⚠️ Imperva block en detail page')
  writeFileSync(resolve('scripts/hab2-detail-imperva.html'), detailHtml)
} else {
  writeFileSync(resolve('scripts/hab2-detail.html'), detailHtml)
  console.log(`✅ Detail HTML guardado (${detailHtml.length} bytes)`)
}

await detailPage.close()
await context.close()
await browser.close()
console.log('Done.')
