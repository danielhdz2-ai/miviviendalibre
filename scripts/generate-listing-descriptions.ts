/**
 * generate-listing-descriptions.ts
 *
 * Genera descripciones únicas con Gemini para listings activos que no tengan
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
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
import { resolve } from 'path'

// ── Carga .env.local ─────────────────────────────────────────────────────────
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const GEMINI_KEY   = process.env.GEMINI_API_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}
if (!GEMINI_KEY) {
  console.error('❌ Falta GEMINI_API_KEY en .env.local')
  process.exit(1)
}

const EXECUTE    = process.argv.includes('--execute')
const BATCH_SIZE = 20   // listings por ejecución
const DELAY_MS   = 600  // ms entre llamadas a Gemini (evitar rate limit)

const sb    = createClient(SUPABASE_URL, SUPABASE_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

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

// ── Llama a Gemini ────────────────────────────────────────────────────────────
async function generateDescription(listing: Listing): Promise<string | null> {
  try {
    const prompt = buildPrompt(listing)
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()
    if (!text || text.length < 50) return null
    return text
  } catch (err) {
    console.warn(`  ⚠️  Gemini error para ${listing.id}:`, (err as Error).message)
    return null
  }
}

// ── Pausa ─────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🤖 Generate Listing Descriptions — modo: ${EXECUTE ? 'EXECUTE' : 'DRY RUN'}`)
  console.log(`   Batch: ${BATCH_SIZE} listings | Delay: ${DELAY_MS}ms entre llamadas\n`)

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
    console.log('✅ No hay listings sin ai_description. Todo está al día.')
    return
  }

  console.log(`📋 Listings a procesar: ${listings.length}\n`)

  let ok = 0, skip = 0, fail = 0

  for (const listing of listings as Listing[]) {
    const shortTitle = (listing.title ?? listing.id).slice(0, 60)
    process.stdout.write(`  → [${listing.id}] ${shortTitle}… `)

    const description = await generateDescription(listing)

    if (!description) {
      console.log('❌ SKIP (sin respuesta)')
      fail++
      await sleep(DELAY_MS)
      continue
    }

    const wordCount = description.split(/\s+/).length
    console.log(`✓ ${wordCount} palabras`)

    if (EXECUTE) {
      const { error: updateError } = await sb
        .from('listings')
        .update({ ai_description: description })
        .eq('id', listing.id)

      if (updateError) {
        console.warn(`    ⚠️  No se pudo guardar: ${updateError.message}`)
        fail++
      } else {
        ok++
      }
    } else {
      console.log(`    Preview: "${description.slice(0, 100)}…"`)
      skip++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n📊 Resultado:`)
  if (EXECUTE) {
    console.log(`   ✅ Guardados: ${ok}`)
    console.log(`   ❌ Errores:  ${fail}`)
    console.log(`\n   Vuelve a ejecutar para procesar el siguiente batch de ${BATCH_SIZE}.`)
  } else {
    console.log(`   📝 Preview (dry run): ${skip} listings`)
    console.log(`\n   Ejecuta con --execute para guardar en la BD.`)
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
