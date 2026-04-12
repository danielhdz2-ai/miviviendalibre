/**
 * Elimina los listings de demostración (seed-content.js) de la BD.
 * Los demos tienen origin = 'seed' o source_portal IS NULL y source_url IS NULL.
 *
 * Uso:
 *   $env:SUPABASE_SERVICE_KEY="..."; npx tsx scripts/clean-demo.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const KEY = process.env.SUPABASE_SERVICE_KEY ?? ''
if (!KEY) { console.error('Falta SUPABASE_SERVICE_KEY'); process.exit(1) }

const sb = createClient(SUPABASE_URL, KEY)

async function main() {
  // 1. Ver distribución de source_portal y origin
  const { data: sample, error: e0 } = await sb
    .from('listings')
    .select('source_portal, origin, source_url')
    .eq('status', 'published')
    .limit(2000)

  if (e0) { console.error(e0.message); process.exit(1) }

  const byPortal: Record<string, number> = {}
  const byOrigin: Record<string, number> = {}
  for (const r of sample ?? []) {
    const p = r.source_portal ?? '(null)'
    const o = r.origin ?? '(null)'
    byPortal[p] = (byPortal[p] ?? 0) + 1
    byOrigin[o] = (byOrigin[o] ?? 0) + 1
  }
  console.log('\nsource_portal:', byPortal)
  console.log('origin:       ', byOrigin)
  console.log('total muestra:', sample?.length)

  // 2. Identificar demos: source_portal = 'mvl-gen'
  console.log('\nConsultando IDs de demos (source_portal = mvl-gen)...')
  const { data: demoRows, error: e1 } = await sb
    .from('listings')
    .select('id, source_portal, origin, title')
    .eq('source_portal', 'mvl-gen')
    .limit(3000)

  if (e1) { console.error(e1.message); process.exit(1) }

  console.log(`\nDemos encontrados: ${demoRows?.length}`)
  if (!demoRows?.length) {
    console.log('No hay demos que eliminar.')
    return
  }

  // Mostrar muestra
  demoRows.slice(0, 5).forEach(r => console.log(' -', r.title, '|', r.source_portal, '|', r.origin))

  const ids = demoRows.map(r => r.id)

  // 3. Borrar imágenes asociadas primero
  console.log('\nBorrando imágenes...')
  const { error: e2 } = await sb
    .from('listing_images')
    .delete()
    .in('listing_id', ids)
  if (e2) console.error('Error borrando imágenes:', e2.message)
  else console.log('Imágenes borradas.')

  // 4. Borrar los listings
  console.log('Borrando listings demo...')
  const { error: e3, count } = await sb
    .from('listings')
    .delete({ count: 'exact' })
    .in('id', ids)

  if (e3) { console.error('Error:', e3.message); process.exit(1) }
  console.log(`✅ Eliminados ${count} listings de demostración.`)
}

main()
