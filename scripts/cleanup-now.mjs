/**
 * Limpieza masiva: ~9.000 → ~900 registros
 * Ejecutar: node scripts/cleanup-now.mjs
 */
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  'https://ktsdxpmaljiyuwimcugx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c2R4cG1hbGppeXV3aW1jdWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NDg1NCwiZXhwIjoyMDkxMjMwODU0fQ.0VuUqRsrb2kNgLfoqyduMC7weRc9JJKtg1r14mOEbi8'
)

async function countAll() {
  const { count } = await db.from('listings').select('id', { count: 'exact', head: true })
  return count
}

// Obtiene los top N IDs de un portal filtrado por zona
async function getTopIds(portal, whereFilters, limit) {
  let q = db.from('listings')
    .select('id, published_at, created_at')
    .eq('source_portal', portal)
  for (const [col, op, val] of whereFilters) {
    if (op === 'ilike') q = q.ilike(col, val)
    else if (op === 'not_ilike') q = q.not(col, 'ilike', val)
    else if (op === 'eq') q = q.eq(col, val)
  }
  q = q.order('published_at', { ascending: false, nullsFirst: false })
       .order('created_at', { ascending: false })
       .limit(limit)
  const { data, error } = await q
  if (error) { console.error('Error getTopIds:', error.message); return [] }
  return (data ?? []).map(r => r.id)
}

// Elimina de un portal los registros que NO están en keepIds
async function deleteExcept(portal, keepIds, extraFilter) {
  let q = db.from('listings').delete().eq('source_portal', portal)
  if (extraFilter) {
    const [col, op, val] = extraFilter
    if (op === 'eq') q = q.eq(col, val)
    else if (op === 'neq') q = q.neq(col, val)
  }
  if (keepIds.length > 0) {
    q = q.not('id', 'in', `(${keepIds.join(',')})`)
  }
  const { error, count } = await q.select('id', { head: true, count: 'exact' })
  return { error, count }
}

console.log('=== LIMPIEZA MASIVA ===')
console.log('Registros antes:', await countAll())

// ── pisos.com: 400 total por zonas (is_particular=false ya que particulares se protegen solos) ──
console.log('\n[pisos.com] Calculando IDs a conservar...')
const MADRID_FILTERS = [['city', 'ilike', '%madrid%']]
const BCN_FILTERS    = [['city', 'ilike', '%barcelona%']]
const VAL_FILTERS    = [['city', 'ilike', '%valencia%']]
const AND_PROVINCES  = ['%sevilla%', '%málaga%', '%malaga%', '%granada%', '%córdoba%', '%cordoba%', '%huelva%', '%cádiz%', '%cadiz%', '%almería%', '%almeria%', '%jaén%', '%jaen%']

// Madrid 100
const pisosKeep = []
pisosKeep.push(...await getTopIds('pisos.com', [['is_particular', 'eq', false], ['city', 'ilike', '%madrid%']], 100))
// Barcelona 100  
pisosKeep.push(...await getTopIds('pisos.com', [['is_particular', 'eq', false], ['city', 'ilike', '%barcelona%']], 100))
// Valencia 100
pisosKeep.push(...await getTopIds('pisos.com', [['is_particular', 'eq', false], ['city', 'ilike', '%valencia%']], 100))
// Resto 100 (simple: los 100 más recientes que no sean las anteriores zonas — usamos limit de 400 total)
const pisosResto = await getTopIds('pisos.com', [['is_particular', 'eq', false]], 400)
for (const id of pisosResto) {
  if (!pisosKeep.includes(id)) pisosKeep.push(id)
  if (pisosKeep.length >= 400) break
}

console.log(`  → Conservar ${pisosKeep.length} de pisos.com`)

// Borrar pisos.com is_particular=false que no están en la lista
const { error: e1 } = await db.from('listings')
  .delete()
  .eq('source_portal', 'pisos.com')
  .eq('is_particular', false)
  .not('id', 'in', `(${pisosKeep.join(',')})`)
if (e1) console.error('  Error pisos.com:', e1.message)
else console.log('  ✅ pisos.com limpiado')

// ── tucasa.com: 200 total ──
console.log('\n[tucasa.com] Calculando IDs...')
const tucasaKeep = []
tucasaKeep.push(...await getTopIds('tucasa.com', [['city', 'ilike', '%madrid%']], 50))
tucasaKeep.push(...await getTopIds('tucasa.com', [['city', 'ilike', '%barcelona%']], 50))
tucasaKeep.push(...await getTopIds('tucasa.com', [['city', 'ilike', '%valencia%']], 50))
const tucasaResto = await getTopIds('tucasa.com', [], 200)
for (const id of tucasaResto) {
  if (!tucasaKeep.includes(id)) tucasaKeep.push(id)
  if (tucasaKeep.length >= 200) break
}
console.log(`  → Conservar ${tucasaKeep.length} de tucasa.com`)
const { error: e2 } = await db.from('listings')
  .delete()
  .eq('source_portal', 'tucasa.com')
  .not('id', 'in', `(${tucasaKeep.join(',')})`)
if (e2) console.error('  Error tucasa.com:', e2.message)
else console.log('  ✅ tucasa.com limpiado')

// ── tecnocasa.es: 50 ──
console.log('\n[tecnocasa.es] Top 50...')
const tecnoKeep = await getTopIds('tecnocasa.es', [], 50)
console.log(`  → Conservar ${tecnoKeep.length}`)
if (tecnoKeep.length > 0) {
  const { error: e3 } = await db.from('listings')
    .delete()
    .eq('source_portal', 'tecnocasa.es')
    .not('id', 'in', `(${tecnoKeep.join(',')})`)
  if (e3) console.error('  Error tecnocasa.es:', e3.message)
  else console.log('  ✅ tecnocasa.es limpiado')
}

// ── gilmar.es: 50 ──
console.log('\n[gilmar.es] Top 50...')
const gilmarKeep = await getTopIds('gilmar.es', [], 50)
console.log(`  → Conservar ${gilmarKeep.length}`)
if (gilmarKeep.length > 0) {
  const { error: e4 } = await db.from('listings')
    .delete()
    .eq('source_portal', 'gilmar.es')
    .not('id', 'in', `(${gilmarKeep.join(',')})`)
  if (e4) console.error('  Error gilmar.es:', e4.message)
  else console.log('  ✅ gilmar.es limpiado')
}

// ── Solvia y Aliseda: borrar todos (banco) ──
console.log('\n[solvia/aliseda] Borrando registros bancarios...')
const { error: e5 } = await db.from('listings')
  .delete()
  .in('source_portal', ['solvia.es', 'aliseda.es'])
if (e5) console.error('  Error bancos:', e5.message)
else console.log('  ✅ Solvia + Aliseda eliminados')

console.log('\nRegistros después:', await countAll())
console.log('=== FIN ===')
