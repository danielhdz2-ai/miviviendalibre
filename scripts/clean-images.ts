/**
 * Limpieza de calidad de imágenes:
 * 1. Borra listings que no tienen imágenes en listing_images (iconos grises)
 * 2. Borra listings que tienen <5 imágenes en la galería (mínimo de calidad)
 * 3. Borra imágenes huérfanas sobrantes
 *
 * Uso: SUPABASE_SERVICE_KEY=xxx npx tsx scripts/clean-images.ts
 * Añade --dry-run para ver qué se borraría sin borrar nada
 */
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
const MIN_PHOTOS = 5

const sb = createClient(
  'https://ktsdxpmaljiyuwimcugx.supabase.co',
  process.env.SUPABASE_SERVICE_KEY!
)

async function run() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_KEY'); process.exit(1)
  }
  if (DRY_RUN) console.log('🔍 MODO DRY-RUN — no se borrará nada\n')

  // ── PASO 1: listings marcados como has_images=false ──────────────────────
  const { data: noImageRows, error: e1 } = await sb
    .from('listings')
    .select('id, title, source_portal')
    .eq('has_images', false)
    .eq('status', 'published')
  if (e1) { console.error('Error paso 1:', e1.message); process.exit(1) }

  const noImageIds = (noImageRows ?? []).map(r => r.id as string)
  console.log(`🔍 Listings con has_images=false: ${noImageIds.length}`)
  if (!DRY_RUN && noImageIds.length > 0) {
    await sb.from('listings').delete().in('id', noImageIds)
    console.log(`🗑️  Borrados: ${noImageIds.length}`)
  }

  // ── PASO 2: listings con has_images=true pero 0 filas en listing_images ──
  // (inconsistencia — el trigger falló o las imágenes se borraron)
  const { data: allPublished } = await sb
    .from('listings')
    .select('id, title, source_portal')
    .eq('status', 'published')
    .not('id', 'in', `(${noImageIds.length ? noImageIds.map(id => `'${id}'`).join(',') : "'00000000-0000-0000-0000-000000000000'"})`)

  // Obtener conteo de imágenes por listing en batch
  const ids = (allPublished ?? []).map(r => r.id as string)
  const { data: imgCounts } = await sb
    .from('listing_images')
    .select('listing_id')
    .in('listing_id', ids)

  // Agrupar conteos
  const countMap = new Map<string, number>()
  for (const row of imgCounts ?? []) {
    countMap.set(row.listing_id, (countMap.get(row.listing_id) ?? 0) + 1)
  }

  // Listings con 0 imágenes reales (aunque has_images=true por error)
  const zeroImgIds = ids.filter(id => !countMap.has(id))
  console.log(`🔍 Listings con has_images=true pero 0 fotos en DB: ${zeroImgIds.length}`)
  if (!DRY_RUN && zeroImgIds.length > 0) {
    await sb.from('listings').delete().in('id', zeroImgIds)
    console.log(`🗑️  Borrados: ${zeroImgIds.length}`)
  }

  // ── PASO 3: listings con menos de MIN_PHOTOS imágenes (baja calidad) ─────
  const fewImgsIds = ids.filter(id => {
    const c = countMap.get(id) ?? 0
    return c > 0 && c < MIN_PHOTOS
  })
  const fewImgsDetails = (allPublished ?? [])
    .filter(r => fewImgsIds.includes(r.id))
    .map(r => ({ id: r.id, portal: r.source_portal, count: countMap.get(r.id) ?? 0 }))

  console.log(`\n🔍 Listings con 1-${MIN_PHOTOS - 1} fotos (baja calidad): ${fewImgsIds.length}`)
  if (DRY_RUN) {
    const byPortal: Record<string, number> = {}
    for (const r of fewImgsDetails) byPortal[r.portal] = (byPortal[r.portal] ?? 0) + 1
    console.log('   Por portal:', byPortal)
  } else if (fewImgsIds.length > 0) {
    // Borrar imágenes primero, luego el listing
    await sb.from('listing_images').delete().in('listing_id', fewImgsIds)
    await sb.from('listings').delete().in('id', fewImgsIds)
    console.log(`🗑️  Borrados: ${fewImgsIds.length}`)
  }

  // ── PASO 4: imágenes huérfanas (por si acaso) ─────────────────────────────
  const { data: validListings } = await sb.from('listings').select('id')
  const validIds = (validListings ?? []).map(r => `'${r.id}'`).join(',')
  if (validIds) {
    const { count: orphans } = await sb
      .from('listing_images')
      .select('*', { count: 'exact', head: true })
      .not('listing_id', 'in', `(${validIds})`)
    console.log(`\n🔍 Imágenes huérfanas: ${orphans}`)
    if (!DRY_RUN && orphans && orphans > 0) {
      await sb.from('listing_images').delete().not('listing_id', 'in', `(${validIds})`)
      console.log(`🧹 Huérfanas borradas: ${orphans}`)
    }
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  const { count: remaining } = await sb
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  console.log(`\n✅ Listings publicados restantes: ${remaining}`)
}

run().catch(console.error)
