/**
 * fix-html-entities.ts
 * ─────────────────────────────────────────────────────────────────────
 * Limpia entidades HTML (&#xE1; → á, &amp; → &, etc.) en la tabla
 * listings de Supabase. Afecta a: title, description, city, district, province.
 *
 * Modo dry-run (defecto) → muestra qué cambiaría sin tocar la DB.
 * Modo execute           → aplica los cambios.
 *
 * Uso:
 *   npx tsx scripts/fix-html-entities.ts           # dry-run
 *   npx tsx scripts/fix-html-entities.ts --execute  # aplica cambios
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

// ── dotenvx / dotenv ────────────────────────────────────────────────────────
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
const key  = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const EXECUTE  = process.argv.includes('--execute')
const BATCH    = 500

// ── Decoder idéntico al de src/lib/html.ts ──────────────────────────────────
function decodeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&#[Xx]([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g,              (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&apos;/g,  "'")
    .replace(/&nbsp;/g,  '\u00A0')
    .replace(/&ntilde;/g, 'ñ').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú').replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú')
    .replace(/&uuml;/g,  'ü').replace(/&Uuml;/g,   'Ü')
}

function hasEntities(s: string | null | undefined): boolean {
  if (!s) return false
  return /&#[Xx0-9]|&(?:amp|lt|gt|quot|apos|nbsp|[nN]tilde|[aeiouAEIOU](?:acute|uml));/
    .test(s)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🧹 fix-html-entities — modo: ${EXECUTE ? '✅ EXECUTE' : '🔍 DRY-RUN'}`)
  console.log('─'.repeat(60))

  let page     = 0
  let reviewed = 0
  let fixed    = 0
  let errors   = 0

  while (true) {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, description, city, district, province')
      .range(page * BATCH, page * BATCH + BATCH - 1)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error en query:', error.message)
      break
    }
    if (!data?.length) break

    for (const row of data) {
      reviewed++

      const fields: Record<string, string | null> = {
        title:       row.title,
        description: row.description,
        city:        row.city,
        district:    row.district,
        province:    row.province,
      }

      const dirty = Object.values(fields).some(v => hasEntities(v))
      if (!dirty) continue

      const patch: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(fields)) {
        if (hasEntities(v)) patch[k] = decodeHtml(v) || null
      }

      const changes = Object.entries(patch)
        .map(([k, v]) => `  ${k}: "${fields[k]?.slice(0, 60)}" → "${v?.slice(0, 60)}"`)
        .join('\n')

      if (!EXECUTE) {
        console.log(`\n📝 ${row.id}\n${changes}`)
        fixed++
        continue
      }

      const { error: upErr } = await supabase
        .from('listings')
        .update(patch)
        .eq('id', row.id)

      if (upErr) {
        console.error(`  ❌ Error actualizando ${row.id}: ${upErr.message}`)
        errors++
      } else {
        fixed++
        console.log(`  ✅ ${row.id} — ${Object.keys(patch).join(', ')}`)
      }
    }

    page++
    if (data.length < BATCH) break
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`  Revisados: ${reviewed}  |  ${EXECUTE ? 'Corregidos' : 'Afectados (dry-run)'}: ${fixed}  |  Errores: ${errors}`)
  if (!EXECUTE && fixed > 0) {
    console.log('\n  ▶ Ejecuta con --execute para aplicar los cambios.')
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
