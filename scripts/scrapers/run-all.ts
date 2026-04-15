/**
 * Script maestro boutique — selección curada de anuncios de calidad
 *
 * Ejecuta solo scrapers de Fetch (rápidos, sin Playwright) con límites estrictos.
 * Reglas de oro:
 *   - Máx. 5 anuncios NUEVOS por tarea (con mínimo 5 fotos reales obligatorio)
 *   - Sin duplicados: upsertListing deduplica por source_portal + source_external_id
 *   - Scrapers Playwright (redpiso, monapart) pausados
 *   - Tecnocasa: VETADO PERMANENTEMENTE (imágenes = planos/logos, precios erróneos)
 *
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts --max 10
 *
 * Producción de pisos/día (aprox.):
 *   pisos.com part. alquiler  →  5
 *   pisos.com part. venta     →  5
 *   tucasa venta              →  5
 *   tucasa alquiler           →  5
 *   enalquiler (particulares) →  5
 *   milanuncios (particulares)→  5
 *   solvia (bancarios)        →  5
 *   ─────────────────────────── 35 anuncios nuevos diarios máx.
 */

import { execSync } from 'child_process'

const args = process.argv.slice(2)
const MAX  = args.includes('--max') ? args[args.indexOf('--max') + 1] : '5'

const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_KEY\n  Uso: SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts')
  process.exit(1)
}

// maxPages = 2 para dar margen de búsqueda (no todos los de pág 1 serán nuevos)
// maxItems = MAX — para cortar en cuanto se alcanzan los nuevos
const PAGES = '2'

const jobs: { label: string; cmd: string }[] = [
  // ── pisos.com Particulares ─────────────────────────────────────────────────
  {
    label: '🏠 pisos.com particulares — alquiler Madrid',
    cmd: `npx tsx scripts/scrapers/pisoscom_particulares.ts alquiler madrid ${PAGES} ${MAX}`,
  },
  {
    label: '🏠 pisos.com particulares — alquiler Barcelona',
    cmd: `npx tsx scripts/scrapers/pisoscom_particulares.ts alquiler barcelona ${PAGES} ${MAX}`,
  },
  {
    label: '🏠 pisos.com particulares — venta Madrid',
    cmd: `npx tsx scripts/scrapers/pisoscom_particulares.ts venta madrid ${PAGES} ${MAX}`,
  },
  {
    label: '🏠 pisos.com particulares — venta Barcelona',
    cmd: `npx tsx scripts/scrapers/pisoscom_particulares.ts venta barcelona ${PAGES} ${MAX}`,
  },

  // ── tucasa.com ─────────────────────────────────────────────────────────────
  {
    label: '🏠 tucasa — venta Madrid',
    cmd: `npx tsx scripts/scrapers/tucasa_standalone.ts venta madrid ${PAGES} 0 ${MAX}`,
  },
  {
    label: '🏠 tucasa — alquiler Madrid',
    cmd: `npx tsx scripts/scrapers/tucasa_standalone.ts alquiler madrid ${PAGES} 0 ${MAX}`,
  },
  {
    label: '🏠 tucasa — venta Valencia',
    cmd: `npx tsx scripts/scrapers/tucasa_standalone.ts venta valencia ${PAGES} 0 ${MAX}`,
  },

  // ── enalquiler.com (solo alquiler, 100% particulares) ─────────────────────
  {
    label: '🏠 enalquiler — Madrid',
    cmd: `npx tsx scripts/scrapers/enalquiler.ts madrid ${PAGES} ${MAX}`,
  },
  {
    label: '🏠 enalquiler — Barcelona',
    cmd: `npx tsx scripts/scrapers/enalquiler.ts barcelona ${PAGES} ${MAX}`,
  },

  // ── milanuncios (solo particulares via &demandante=par) ───────────────────
  {
    label: '🏠 milanuncios particulares — venta Madrid',
    cmd: `npx tsx scripts/scrapers/milanuncios.ts venta madrid ${PAGES} ${MAX}`,
  },
  {
    label: '🏠 milanuncios particulares — alquiler Madrid',
    cmd: `npx tsx scripts/scrapers/milanuncios.ts alquiler madrid ${PAGES} ${MAX}`,
  },

  // ── solvia.es (bancarios Sabadell — oportunidades de banco) ───────────────
  {
    label: '🏦 solvia — venta',
    cmd: `npx tsx scripts/scrapers/solvia.ts venta ${PAGES} ${MAX}`,
  },
  {
    label: '🏦 solvia — alquiler',
    cmd: `npx tsx scripts/scrapers/solvia.ts alquiler ${PAGES} ${MAX}`,
  },
]

// ─── BOTS PAUSADOS (Playwright) ───────────────────────────────────────────────
// tecnocasa, redpiso, monapart — pendiente verificar si están bloqueados

console.log(`\n🚀 Mi Vivienda Libre — Scraper Boutique`)
console.log(`   ${jobs.length} tareas | Máx. ${MAX} anuncios nuevos por tarea`)
console.log(`   Solo anuncios con foto. Deduplicación automática.\n`)

let totalJobs = 0
let okJobs = 0

for (const job of jobs) {
  totalJobs++
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`[${totalJobs}/${jobs.length}] ${job.label}`)
  console.log('─'.repeat(60))
  try {
    execSync(job.cmd, {
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_SERVICE_KEY: KEY },
    })
    okJobs++
  } catch {
    console.warn(`⚠️  Tarea falló, continuando...`)
  }

  // Pausa entre scrapers para no saturar la IP
  await new Promise(r => setTimeout(r, 2000))
}

console.log(`\n${'═'.repeat(60)}`)
console.log(`✅ Completado: ${okJobs}/${totalJobs} tareas exitosas`)
console.log(`   ~${okJobs * parseInt(MAX)} anuncios nuevos máx. añadidos hoy`)
console.log('═'.repeat(60))

