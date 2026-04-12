/**
 * normalize-titles.ts
 * Normaliza títulos sucios de scrapers usando Gemini Flash.
 *
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx GOOGLE_AI_API_KEY=xxx npx tsx scripts/normalize-titles.ts
 *   SUPABASE_SERVICE_KEY=xxx GOOGLE_AI_API_KEY=xxx npx tsx scripts/normalize-titles.ts --limit 200
 *
 * Detecta títulos que parecen "sucios" (todo mayúsculas, abreviaturas de scraper)
 * y los convierte a títulos elegantes estilo Inmonest.
 * Procesa en batches de 10 para minimizar llamadas a la API.
 */

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''
const GEMINI_KEY   = process.env.GOOGLE_AI_API_KEY ?? ''
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const args  = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 100

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// ── Detectar si un título necesita normalización ─────────────────────────────
function needsNormalization(title: string): boolean {
  if (!title || title.length < 4) return false
  const upper = title.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ ]/g, '')
  if (!upper) return false
  // Más del 60% de letras en mayúsculas → scraper
  const upperCount = (upper.match(/[A-ZÁÉÍÓÚÜÑ]/g) ?? []).length
  const ratio = upperCount / upper.length
  if (ratio > 0.6) return true
  // Contiene abreviaturas típicas de scraper
  const scraperPatterns = /\b(HAB|HB|BA|M2|M²|KM|REF|TLF|TEL|DORM|PLANT|PTA|ESC|KW|VENT|CALEF)\b/i
  if (scraperPatterns.test(title)) return true
  return false
}

// ── Llamar a Gemini Flash con un batch de títulos ────────────────────────────
async function normalizeBatch(titles: string[]): Promise<string[]> {
  const numbered = titles.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const prompt = `Eres el redactor de Inmonest, plataforma inmobiliaria española. 
Tu trabajo es convertir títulos sucios de scrapers en títulos elegantes y descriptivos.

REGLAS:
- Máximo 70 caracteres
- Usa título estilo oración (solo primera letra en mayúscula, nombres propios capitalizados)
- Sé descriptivo: menciona lo más destacable (luminoso, terraza, reformado, céntrico, vistas, etc.) SI se puede inferir
- Nunca inventes habitaciones ni precios que no aparezcan en el título original
- En formato: responde SOLO con los títulos numerados, uno por línea, sin texto extra

EJEMPLOS:
1. PISO EN CALLE ARAGON 3 HAB REFORMADO → 1. Piso reformado de 3 habitaciones en calle Aragón
2. APARTAMENTO LUMINOSO CENTRO MADRID 2 DORM → 2. Apartamento luminoso de 2 dormitorios en el centro de Madrid
3. CASA ADOSADA CON JARDIN Y GARAJE SEVILLA → 3. Casa adosada con jardín y garaje en Sevilla

TÍTULOS A NORMALIZAR:
${numbered}

Responde con los mismos números y los títulos normalizados:`

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  })

  if (!res.ok) {
    console.error(`  ⚠️  Gemini error: ${res.status} ${await res.text().then(t => t.slice(0, 100))}`)
    return titles // devolver originales si falla
  }

  const json = await res.json() as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Parsear respuesta numerada: "1. Título normalizado"
  const result: string[] = [...titles] // fallback a originales
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.+)$/)
    if (m) {
      const idx = parseInt(m[1]) - 1
      const normalized = m[2].trim()
      if (idx >= 0 && idx < titles.length && normalized.length > 3) {
        result[idx] = normalized.slice(0, 70)
      }
    }
  }
  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_KEY) { console.error('❌ Falta SUPABASE_SERVICE_KEY'); process.exit(1) }
  if (!GEMINI_KEY)   { console.error('❌ Falta GOOGLE_AI_API_KEY'); process.exit(1) }

  console.log(`\n🧠 Inmonest — Normalización de títulos (límite: ${LIMIT})\n`)

  // Obtener listings con títulos sucios (solo de origen externo/scraper)
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/listings` +
    `?origin=eq.external&status=eq.published&select=id,title&order=published_at.desc&limit=${LIMIT * 3}`,
    { headers: supabaseHeaders },
  )
  if (!fetchRes.ok) { console.error('❌ Error al obtener listings:', await fetchRes.text()); process.exit(1) }

  const allListings = await fetchRes.json() as Array<{ id: string; title: string }>

  // Filtrar solo los que necesitan normalización
  const toNormalize = allListings
    .filter(l => needsNormalization(l.title))
    .slice(0, LIMIT)

  console.log(`  📋 ${allListings.length} listings externos, ${toNormalize.length} necesitan normalización\n`)

  if (toNormalize.length === 0) {
    console.log('  ✅ Nada que normalizar')
    return
  }

  const BATCH = 10
  let updated = 0
  let failed  = 0

  for (let i = 0; i < toNormalize.length; i += BATCH) {
    const batch = toNormalize.slice(i, i + BATCH)
    console.log(`  📦 Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(toNormalize.length / BATCH)} (${batch.length} títulos)`)

    const originals  = batch.map(l => l.title)
    const normalized = await normalizeBatch(originals)

    // PATCH cada listing con el título normalizado
    for (let j = 0; j < batch.length; j++) {
      const { id } = batch[j]
      const newTitle = normalized[j]
      if (newTitle === originals[j]) { console.log(`    ↷ [${j+1}] Sin cambios`); continue }

      console.log(`    ✏️  [${j+1}] "${originals[j].slice(0, 40)}" → "${newTitle}"`)

      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ title: newTitle }),
      })
      if (patchRes.ok) {
        updated++
      } else {
        console.error(`    ❌ Error patch ${id}: ${await patchRes.text().then(t => t.slice(0, 80))}`)
        failed++
      }
    }

    // Esperar 1s entre batches para respetar rate limit de Gemini (15 req/min)
    if (i + BATCH < toNormalize.length) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Normalizados: ${updated} | Sin cambios: ${toNormalize.length - updated - failed} | Errores: ${failed}`)
  console.log('═'.repeat(50))
}

main().catch(err => { console.error(err); process.exit(1) })
