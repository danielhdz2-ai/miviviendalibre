/**
 * Scraper Servihabitat — Oportunidades Bancarias [ESQUELETO]
 * ──────────────────────────────────────────────────────────
 * Servihabitat Servicios Inmobiliarios = servicer de CaixaBank.
 * CaixaBank delegó la gestión de sus activos inmobiliarios en Servihabitat,
 * empresa participada por TG Capital Real Estate y la propia CaixaBank.
 *
 * Entidad bancaria mostrada: 'CaixaBank (Servihabitat)'
 *
 * Portal: https://www.servihabitat.com
 * Búsqueda venta:    https://www.servihabitat.com/es/inmuebles-venta
 * Búsqueda alquiler: https://www.servihabitat.com/es/inmuebles-alquiler
 *
 * Notas técnicas (a verificar antes de implementar):
 *   - El portal parece usar SSR/Next.js → intentar primero con fetch
 *   - Si el contenido está en JS-chunk: requerir Playwright
 *   - Paginación: parámetro `?page=N` o botón "Siguiente"
 *   - CDN imágenes: `cdn.servihabitat.com/...` (verificar en producción)
 *
 * USO (una vez implementado):
 *   npx tsx scripts/scrapers/servihabitat.ts [operacion] [ciudad] [maxPaginas]
 *   operacion:  venta | alquiler (default: venta)
 *   ciudad:     madrid | barcelona | valencia | sevilla | all (default: all)
 *   maxPaginas: número de páginas a scrapear (default: 5)
 */

// TODO: importar upsertListing y ScrapedListing cuando se implemente
// import { upsertListing, type ScrapedListing } from './utils'

const BANK_ENTITY = 'CaixaBank (Servihabitat)'

// TODO: rellenar el mapa con los slugs reales de la URL de Servihabitat
const CITY_MAP: Record<string, { province: string; city: string; slug: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid',    slug: 'madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona', slug: 'barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia',  slug: 'valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla',   slug: 'sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza',  slug: 'zaragoza' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao',    slug: 'bilbao' },
  malaga:    { province: 'Málaga',    city: 'Málaga',    slug: 'malaga' },
}

// TODO: implementar extracción del listado (SSR o Playwright)
async function extractListingUrls(_html: string): Promise<string[]> {
  // TODO: usar regex o parser HTML para extraer URLs /inmueble/{slug}
  // Patrón probable: <a href="/es/inmueble/piso-barcelona-3-hab-12345">
  throw new Error('TODO: implementar extractListingUrls para Servihabitat')
}

// TODO: implementar extracción del detalle
async function parseDetailPage(_html: string, _sourceUrl: string): Promise<{
  title:       string
  description: string | null
  price:       number | null
  area:        number | null
  bedrooms:    number | null
  bathrooms:   number | null
  province:    string | null
  city:        string | null
  postalCode:  string | null
  lat:         number | null
  lng:         number | null
  images:      string[]
  features:    Record<string, string>
}> {
  // TODO: implementar parseo con regex o Playwright evaluate
  // Campos objetivo:
  //   Precio:      .precio, [class*="price"] → número sin puntos ni €
  //   Superficie:  [class*="area"], m2 regex
  //   Habitaciones .dormitorios, [class*="rooms"]
  //   Baños:       [class*="baths"]
  //   Ubicación:   JSON-LD @type="Apartment" → address.addressLocality + addressRegion
  //   Coordenadas: script variable lat/lng, o Google Maps embed URL
  //   Imágenes:    imgs con src de su CDN (revisar dominio real en producción)
  //   Badge banco: buscar "CaixaBank" / "activo bancario" en el HTML
  throw new Error('TODO: implementar parseDetailPage para Servihabitat')
}

// TODO: implementar scraper principal
async function scrapeServihabitat(_operation: 'venta' | 'alquiler', _cityKey: string, _maxPages: number) {
  console.log(`🏦 Servihabitat (CaixaBank) — entidad: ${BANK_ENTITY}`)
  console.log('⚠️  SCRAPER AÚN NO IMPLEMENTADO')
  console.log('')
  console.log('Pasos para implementar:')
  console.log('  1. Verificar si el portal usa SSR o requiere Playwright')
  console.log('     → Fetch https://www.servihabitat.com/es/inmuebles-venta y ver si hay HTML con anuncios')
  console.log('  2. Identificar los selectores reales (inspeccionar DOM en navegador)')
  console.log('  3. Implementar extractListingUrls() con los selectores correctos')
  console.log('  4. Implementar parseDetailPage() para los campos necesarios')
  console.log('  5. Añadir llamada a upsertListing() con is_bank=true y bank_entity')
  console.log('  6. Añadir job en .github/workflows/scrapers.yml')
  console.log('')
  console.log(`  Entidad a usar: '${BANK_ENTITY}'   ← ya definido arriba`)
}

// Entry point
const [op = 'venta', city = 'all', maxPagesStr = '5'] = process.argv.slice(2)
scrapeServihabitat(
  (op === 'alquiler' ? 'alquiler' : 'venta') as 'venta' | 'alquiler',
  CITY_MAP[city] ? city : 'all',
  parseInt(maxPagesStr, 10)
)
