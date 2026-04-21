/**
 * Diagnóstico Wallapop — sin importar nada
 * Muestra qué URLs encuentra y por qué el scraper no importa
 */
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const browser = await chromium.launch({ headless: false }) // headless:false para ver qué pasa
try {
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'es-ES',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Prueba 1: URL antigua (la que usa el scraper actual)
  const url1 = 'https://es.wallapop.com/inmobiliaria/alquilar-piso/madrid'
  console.log(`\n🔍 Navegando a: ${url1}`)
  await page.goto(url1, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)
  const finalUrl1 = page.url()
  const title1 = await page.title()
  console.log(`   URL final: ${finalUrl1}`)
  console.log(`   Título: ${title1}`)

  // ¿Hay selector de items?
  await page.waitForSelector('a[href*="/item/"]', { timeout: 8000 }).catch(() => {})
  const hrefs1 = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href*="/item/"]')].map(a => a.href).slice(0, 10)
  })
  console.log(`   Links /item/ encontrados: ${hrefs1.length}`)
  hrefs1.forEach(h => console.log(`     ${h}`))

  // Todos los links para diagnóstico
  const allLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')].map(a => a.href)
      .filter(h => h.includes('wallapop'))
      .slice(0, 20)
  })
  console.log(`\n   Primeros 20 links wallapop en la página:`)
  allLinks.forEach(h => console.log(`     ${h}`))

  // Prueba 2: URL de búsqueda directa con params
  console.log(`\n\n🔍 Prueba 2: URL búsqueda con parámetros API`)
  const url2 = 'https://es.wallapop.com/app/search?category_ids=200&filters_source=default_filters&latitude=40.4168&longitude=-3.7038&keywords=piso+alquiler&order_by=newest&distance=50000'
  await page.goto(url2, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)
  const finalUrl2 = page.url()
  console.log(`   URL final: ${finalUrl2}`)
  await page.waitForSelector('a[href*="/item/"]', { timeout: 8000 }).catch(() => {})
  const hrefs2 = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href*="/item/"]')].map(a => a.href).slice(0, 10)
  })
  console.log(`   Links /item/ encontrados: ${hrefs2.length}`)
  hrefs2.forEach(h => console.log(`     ${h}`))

  await page.screenshot({ path: 'wallapop-diag.png' })
  console.log(`\n📸 Screenshot guardado: wallapop-diag.png`)
  await page.waitForTimeout(3000)
} finally {
  await browser.close()
}
