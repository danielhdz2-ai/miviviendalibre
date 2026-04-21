/**
 * purge-bad-listings.mts
 * Elimina de la BD todos los anuncios que:
 *  1. Contienen palabras de la blacklist (hipoteca, deuda, nuda propiedad, indiviso, embargo, subasta, etc.)
 *  2. Tienen precio de venta < 30.000 € o precio de alquiler < 200 €/mes
 *
 * Uso:
 *   npx tsx scripts/purge-bad-listings.mts           → modo DRY RUN (solo lista, no borra)
 *   npx tsx scripts/purge-bad-listings.mts --execute  → borra de verdad
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY ?? ''
const DRY_RUN       = !process.argv.includes('--execute')

if (!SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const HEADERS = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=representation',
}

// ── Criterios de purga ─────────────────────────────────────────────────────────
const BLACKLIST_TERMS = [
  'hipoteca',
  'deuda',
  'nuda propiedad',
  'indiviso',
  'embargo',
  'subasta',
  'renta antigua',
  'herencia-',      // "herencia- indiviso-" pero no "calle Herencia"
  'proindiviso',
  'usufructo',
  'uso fructo',
]

const MIN_SALE_PRICE = 30_000   // € 
const MIN_RENT_PRICE = 200      // €/mes

// ── Helpers ────────────────────────────────────────────────────────────────────
async function fetchPage(url: string): Promise<unknown[]> {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    console.error(`❌ Error fetching: ${res.status} ${await res.text()}`)
    return []
  }
  return res.json() as Promise<unknown[]>
}

async function deleteListing(id: string, reason: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY] 🗑  ${id.slice(0, 8)} — ${reason}`)
    return
  }
  // Primero eliminar imágenes relacionadas
  await fetch(
    `${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${id}`,
    { method: 'DELETE', headers: HEADERS }
  )
  // Luego eliminar el listing
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`,
    { method: 'DELETE', headers: HEADERS }
  )
  if (!res.ok) {
    console.error(`  ❌ Error borrando ${id}: ${await res.text()}`)
  } else {
    console.log(`  ✅ Borrado ${id.slice(0, 8)} — ${reason}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🧹 PURGA DE ANUNCIOS BASURA ${DRY_RUN ? '(DRY RUN — solo lista)' : '⚠️ MODO REAL — BORRANDO'}`)
  console.log(`   Pasa --execute para borrar de verdad\n`)

  let totalChecked = 0
  let totalPurged  = 0
  const offset_step = 1000
  let offset = 0
  let keepGoing = true

  while (keepGoing) {
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?status=eq.published` +
      `&select=id,title,description,operation,price_eur` +
      `&order=id.asc&limit=${offset_step}&offset=${offset}`

    const rows = await fetchPage(url) as Array<{
      id: string
      title: string
      description: string | null
      operation: string
      price_eur: number | null
    }>

    if (rows.length === 0) { keepGoing = false; break }

    for (const row of rows) {
      totalChecked++
      const text = `${row.title ?? ''} ${row.description ?? ''}`.toLowerCase()

      // ── Blacklist check ───────────────────────────────────────────────────
      const matchedTerm = BLACKLIST_TERMS.find(term => text.includes(term))
      if (matchedTerm) {
        totalPurged++
        await deleteListing(row.id, `blacklist: "${matchedTerm}" en "${row.title?.slice(0, 60)}"`)
        continue
      }

      // ── Precio irreal ─────────────────────────────────────────────────────
      if (row.price_eur !== null) {
        if (row.operation === 'sale'  && row.price_eur < MIN_SALE_PRICE) {
          totalPurged++
          await deleteListing(row.id, `precio venta irreal: ${row.price_eur}€ — "${row.title?.slice(0, 50)}"`)
          continue
        }
        if (row.operation === 'rent' && row.price_eur < MIN_RENT_PRICE) {
          totalPurged++
          await deleteListing(row.id, `precio alquiler irreal: ${row.price_eur}€/mes — "${row.title?.slice(0, 50)}"`)
          continue
        }
      }
    }

    offset += offset_step
    if (rows.length < offset_step) keepGoing = false

    // Pequeña pausa para no saturar la API de Supabase
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n📊 RESULTADO:`)
  console.log(`   Anuncios revisados : ${totalChecked}`)
  console.log(`   ${DRY_RUN ? 'Se borrarían' : 'Borrados'}     : ${totalPurged}`)
  if (DRY_RUN && totalPurged > 0) {
    console.log(`\n   👆 Ejecuta con --execute para borrarlos de verdad`)
  }
}

main().catch(console.error)
