/**
 * repair-agency-misclassified.mts
 * ════════════════════════════════════════════════════════════════════════════
 * Detecta y corrige anuncios de AGENCIAS clasificados incorrectamente como
 * is_particular=true en la base de datos.
 *
 * Criterio: listing con is_particular=true cuyo title o description contiene
 * señales inequívocas de agencia (ej. "Agency", "en exclusiva", "inmobiliaria").
 *
 * Modo DRY RUN por defecto — usa --execute para aplicar cambios reales.
 *
 * Uso:
 *   npx tsx scripts/repair-agency-misclassified.mts           → muestra candidatos
 *   npx tsx scripts/repair-agency-misclassified.mts --execute  → corrige en la BD
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY ?? ''
const DRY_RUN      = !process.argv.includes('--execute')

if (!SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const HEADERS = {
  apikey:         SERVICE_KEY,
  Authorization:  `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// ── Señales inequívocas de agencia ────────────────────────────────────────────
// Estas expresiones NO deben aparecer en descripciones de particulares reales.
const AGENCY_HARD_SIGNALS: string[] = [
  'agency',               // inglés directo — ej: "La Casa Agency"
  'en exclusiva',         // frase canónica de agencias
  'presenta en exclusiva',
  'inmobiliaria',
  'agencia inmobiliaria',
  'honorarios de agencia',
  'gastos de agencia',
  'comisión de agencia',
  'nuestros inmuebles',
  'nuestra cartera',
  'grupo inmobiliario',
  'servicios inmobiliarios',
  'asesor inmobiliario',
  'asesoramiento inmobiliario',
  'gestión integral',
  'gestión inmobiliaria',
  'real estate',
  'anunciante profesional',
  'info@',
  'ventas@',
  'contacto@',
  // Franquicias conocidas
  're/max', 'remax', 'century 21', 'keller williams', 'engel & völkers',
  'coldwell banker', 'donpiso', 'housell', 'tecnocasa', 'tuksa', 'gilmar',
  'solvia', 'servihabitat', 'aliseda', 'lucas fox',
]

function hasAgencySignal(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase()
  return AGENCY_HARD_SIGNALS.find(s => text.includes(s)) ?? null
}

// ── Fetch paginado de listings ────────────────────────────────────────────────
interface Listing {
  id: string
  title: string
  description: string | null
  source_portal: string | null
}

async function fetchAllParticulares(): Promise<Listing[]> {
  const results: Listing[] = []
  const PAGE = 1000
  let offset = 0

  while (true) {
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?is_particular=eq.true` +
      `&select=id,title,description,source_portal` +
      `&limit=${PAGE}&offset=${offset}`

    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) {
      console.error(`❌ Error fetchPage offset=${offset}: ${res.status}`)
      break
    }
    const page: Listing[] = await res.json() as Listing[]
    results.push(...page)
    if (page.length < PAGE) break
    offset += PAGE
  }

  return results
}

async function markAsAgency(id: string, reason: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY] 🏢 ${id.slice(0, 8)} — señal: "${reason}"`)
    return
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ is_particular: false }),
    }
  )
  if (!res.ok) {
    console.error(`  ❌ Error actualizando ${id}: ${await res.text()}`)
  } else {
    console.log(`  ✅ Corregido ${id.slice(0, 8)} — señal: "${reason}"`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Auditoría de agencias mal clasificadas como particulares`)
  console.log(`   Modo: ${DRY_RUN ? 'DRY RUN (sin cambios)' : '⚠️  EJECUTANDO CAMBIOS REALES'}`)
  console.log(`   Señales de agencia a detectar: ${AGENCY_HARD_SIGNALS.length}\n`)

  const listings = await fetchAllParticulares()
  console.log(`📋 Total listings is_particular=true en BD: ${listings.length}`)

  let detected = 0
  const bySignal: Record<string, number> = {}

  for (const l of listings) {
    const signal = hasAgencySignal(l.title ?? '', l.description ?? '')
    if (signal) {
      detected++
      bySignal[signal] = (bySignal[signal] ?? 0) + 1
      const portal = l.source_portal ? ` [${l.source_portal}]` : ''
      console.log(`  🏢 "${l.title?.slice(0, 60)}"${portal}`)
      await markAsAgency(l.id, signal)
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Listings analizados : ${listings.length}`)
  console.log(`   Agencias detectadas : ${detected}`)
  if (detected > 0) {
    console.log(`\n   Señales más frecuentes:`)
    Object.entries(bySignal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([sig, count]) => console.log(`     "${sig}" → ${count} anuncio(s)`))
  }

  if (DRY_RUN && detected > 0) {
    console.log(`\n💡 Para aplicar los cambios, ejecuta:`)
    console.log(`   npx tsx scripts/repair-agency-misclassified.mts --execute\n`)
  } else if (!DRY_RUN) {
    console.log(`\n✅ ${detected} anuncio(s) reclasificados a is_particular=false.\n`)
  } else {
    console.log(`\n✅ Sin agencias mal clasificadas detectadas.\n`)
  }
}

main().catch(console.error)
