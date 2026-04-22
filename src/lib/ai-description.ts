/**
 * ai-description.ts
 *
 * Utilidad compartida para generar descripciones con IA usando OpenRouter.
 * Usada por:
 *  - src/app/api/publicar/route.ts   → al publicar un anuncio nuevo
 *  - src/app/api/cron/generate-descriptions/route.ts → backfill batch
 */

const OR_MODEL = 'google/gemini-2.0-flash-lite-001'

interface ListingInput {
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

function buildPrompt(l: ListingInput): string {
  const op = l.operation === 'rent' ? 'alquiler' : 'venta'
  const hab =
    l.bedrooms === 0
      ? 'estudio'
      : l.bedrooms === 1
        ? '1 habitación'
        : `${l.bedrooms} habitaciones`
  const ubicacion = [l.district, l.city, l.province].filter(Boolean).join(', ')
  const precio = l.price_eur
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

/**
 * Genera una descripción IA para un listing.
 * Devuelve null si la API falla o la respuesta es inválida.
 */
export async function generateAiDescription(
  listing: ListingInput,
  openrouterKey: string,
): Promise<string | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inmonest.com',
        'X-Title': 'Inmonest',
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [{ role: 'user', content: buildPrompt(listing) }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!res.ok) return null

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? ''
    return text.length >= 50 ? text : null
  } catch {
    return null
  }
}
