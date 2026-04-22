/**
 * generate-listing-descriptions.ts
 *
 * Genera descripciones únicas con OpenRouter para listings activos que no tengan
 * ai_description todavía. Las guarda en la columna `ai_description`.
 *
 * Uso:
 *   npx tsx scripts/generate-listing-descriptions.ts           # dry run (preview)
 *   npx tsx scripts/generate-listing-descriptions.ts --execute  # escribe en DB
 *
 * O via npm:
 *   npm run generate-descriptions
 *   npm run generate-descriptions -- --execute
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// ── Carga .env.local ─────────────────────────────────────────────────────────
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}
if (!OPENROUTER_KEY) {
  console.error('❌ Falta OPENROUTER_API_KEY en .env.local')
  process.exit(1)
}

const EXECUTE    = process.argv.includes('--execute')
const RUN_ALL    = process.argv.includes('--all')   // procesa todos los pendientes en loop
const BATCH_SIZE = RUN_ALL ? 50 : 20  // más grande en modo --all
const DELAY_MS   = RUN_ALL ? 200 : 500  // más rápido en modo --all
const OR_MODEL   = 'google/gemini-2.0-flash-lite-001'

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Listing {
  id: string
  title: string
  description: string | null
  operation: string
  city: string | null
  district: string | null
  province: string | null
  price_eur: number | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
}

// ── Prompt ───────────────────────────────────────────────────────────────────
function buildPrompt(l: Listing): string {
  const op        = l.operation === 'rent' ? 'alquiler' : 'venta'
  const hab       = l.bedrooms === 0 ? 'estudio' : l.bedrooms === 1 ? '1 habitación' : `${l.bedrooms} habitaciones`
  const ubicacion = [l.district, l.city, l.province].filter(Boolean).join(', ')
  const precio    = l.price_eur
    ? `${l.price_eur.toLocaleString('es-ES')} €${l.operation === 'rent' ? '/mes' : ''}`
    : null

  return `Eres un experto redactor de anuncios inmobiliarios en España.
Escribe una descripción atractiva de 120-150 palabras para este piso:

- Operación: ${op}
- Ubicación: ${ubicacion || 'España'}
- Tipo: ${hab}
${l.bathrooms ? `- Baños: ${l.bathrooms}` : ''}
${l.area_m2 ? `- Superficie: ${l.area_m2} m²` : ''}
${precio ? `- Precio: ${precio}` : ''}
- Publicado por propietario directo (sin agencia)

Requisitos:
- Tono cercano, como si lo escribiera el propio propietario
- Destaca la ubicación y el ambiente del barrio
- Menciona características positivas (luminosidad, distribución, transporte)
- Termina con llamada a la acción para contactar
- No inventes datos concretos no proporcionados
- Sin emojis, sin markdown, solo texto plano
- EXACTAMENTE entre 120 y 150 palabras

Responde SOLO con el texto de la descripción, sin comillas ni explicaciones.`
}

// ── Llama a OpenRouter ───────────────────────────────────────────────────────
async function generateDescription(listing: Listing): Promise<string | null> {
  try {
    const prompt = buildPrompt(listing)
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inmonest.com',
        'X-Title': 'Inmonest',
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.warn(`  ⚠️  OpenRouter ${res.status} para ${listing.id}:`, err.slice(0, 200))
      return null
    }
    const json = await res.json() as { choices?: { message?: { content?: string } }[] }
    const text = json.choices?.[0]?.message?.content?.trim() ?? ''
    if (!text || text.length < 50) return null
    return text
  } catch (err) {
    console.warn(`  ⚠️  Error para ${listing.id}:`, (err as Error).message)
    return null
  }
}

// ── Pausa ─────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🤖 Generate Listing Descriptions — modo: ${EXECUTE ? 'EXECUTE' : 'DRY RUN'}`)
  console.log(`   Batch: ${BATCH_SIZE} listings | Delay: ${DELAY_MS}ms entre llamadas\n`)

  // Conteo total de pendientes
  const { count: totalPending } = await sb
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('ai_description.is.null,ai_description.eq.')
  const { count: totalDone } = await sb
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('ai_description', 'is', null)
  console.log(`📊 Total publicados con descripción IA: ${totalDone ?? 0}`)
  console.log(`⏳ Total pendientes: ${totalPending ?? 0}`)
  console.log(`   Batches restantes: ~${Math.ceil((totalPending ?? 0) / BATCH_SIZE)}\n`)

  if (process.argv.includes('--count-only')) return

  let totalOk = 0, totalFail = 0, batchNum = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    batchNum++
    if (RUN_ALL) process.stdout.write(`\n⏩ Batch #${batchNum}… `)

    // Busca listings sin ai_description
    const { data: listings, error } = await sb
      .from('listings')
      .select('id, title, description, operation, city, district, province, price_eur, bedrooms, bathrooms, area_m2')
      .eq('status', 'published')
      .or('ai_description.is.null,ai_description.eq.')
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE)

    if (error) {
      console.error('❌ Error al leer listings:', error.message)
      process.exit(1)
    }

    if (!listings || listings.length === 0) {
      console.log('\n✅ No hay más listings sin ai_description. ¡Todo al día!')
      break
    }

    if (RUN_ALL) console.log(`${listings.length} listings`)
    else console.log(`📋 Listings a procesar: ${listings.length}\n`)

    let ok = 0, skip = 0, fail = 0

    for (const listing of listings as Listing[]) {
      const shortTitle = (listing.title ?? listing.id).slice(0, 60)
      if (!RUN_ALL) process.stdout.write(`  → [${listing.id}] ${shortTitle}… `)

      const description = await generateDescription(listing)

      if (!description) {
        if (!RUN_ALL) console.log('❌ SKIP (sin respuesta)')
        fail++
        await sleep(DELAY_MS)
        continue
      }

      const wordCount = description.split(/\s+/).length
      if (!RUN_ALL) console.log(`✓ ${wordCount} palabras`)

      if (EXECUTE) {
        const { error: updateError } = await sb
          .from('listings')
          .update({ ai_description: description })
          .eq('id', listing.id)

        if (updateError) {
          if (!RUN_ALL) console.warn(`    ⚠️  No se pudo guardar: ${updateError.message}`)
          fail++
        } else {
          ok++
        }
      } else {
        if (!RUN_ALL) console.log(`    Preview: "${description.slice(0, 100)}…"`)
        skip++
      }

      await sleep(DELAY_MS)
    }

    totalOk   += ok
    totalFail += fail

    if (RUN_ALL && EXECUTE) {
      const { count: remaining } = await sb
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .or('ai_description.is.null,ai_description.eq.')
      process.stdout.write(`   ✅ +${ok} guardados (total: ${totalOk}) | ⏳ quedan: ${remaining ?? '?'}\r`)
    }

    // Si no estamos en modo --all, salir tras el primer batch
    if (!RUN_ALL) {
      console.log(`\n📊 Resultado:`)
      if (EXECUTE) {
        console.log(`   ✅ Guardados: ${ok}`)
        console.log(`   ❌ Errores:  ${fail}`)
        console.log(`\n   Vuelve a ejecutar para procesar el siguiente batch de ${BATCH_SIZE}.`)
      } else {
        console.log(`   📝 Preview (dry run): ${skip} listings`)
        console.log(`\n   Ejecuta con --execute para guardar en la BD.`)
      }
      break
    }

    // En dry run + --all, solo mostramos el primer batch
    if (!EXECUTE) {
      console.log(`\n   (--all en dry run solo muestra el primer batch. Añade --execute para guardar todo.)`)
      break
    }
  }

  if (RUN_ALL && EXECUTE) {
    console.log(`\n\n🎉 Proceso completo: ${totalOk} descripciones generadas, ${totalFail} errores.`)
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
