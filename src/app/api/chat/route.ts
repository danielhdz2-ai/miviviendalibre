import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGeminiKey(): string {
  return (
    process.env.CLAVE_API_IA_GOOGLE ??
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    ''
  ).trim()
}

function getOpenRouterKey(): string {
  return (process.env.OPENROUTER_API_KEY ?? '').trim()
}

const SYSTEM_PROMPT = `Eres un asistente de búsqueda de pisos para el portal Inmonest.
Tu única función es interpretar lo que el usuario busca y devolver un JSON con los filtros de búsqueda.
Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

Campos posibles del JSON (todos opcionales):
- operation: "rent" | "sale"
- ciudad: string (nombre de ciudad española)
- min_precio: number (precio mínimo en EUR)
- max_precio: number (precio máximo en EUR)
- habitaciones: number (mínimo de habitaciones)
- solo_particulares: boolean

Ejemplos:

Usuario: "busco piso de alquiler en Madrid menos de 900 euros"
{"operation":"rent","ciudad":"Madrid","max_precio":900}

Usuario: "quiero comprar casa en Barcelona con 3 habitaciones"
{"operation":"sale","ciudad":"Barcelona","habitaciones":3}

Usuario: "piso barato en Sevilla de particular"
{"operation":"rent","ciudad":"Sevilla","max_precio":700,"solo_particulares":true}

Usuario: "alquiler Valencia 2 habitaciones entre 600 y 1000"
{"operation":"rent","ciudad":"Valencia","habitaciones":2,"min_precio":600,"max_precio":1000}

Si el usuario pregunta algo que no es una búsqueda de piso, devuelve:
{"error":"Solo puedo ayudarte a buscar pisos y casas en España."}`

function parseFilters(raw: string): Record<string, unknown> {
  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return { raw }
  }
}

async function callGemini(apiKey: string, lastUserMsg: string, recent: Array<{ role: string; content: string }>): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: SYSTEM_PROMPT,
  })

  const rawHistory = recent.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  while (rawHistory.length > 0 && rawHistory[0].role === 'model') rawHistory.shift()

  const chat = model.startChat({ history: rawHistory })
  const result = await chat.sendMessage(lastUserMsg)
  return result.response.text().trim()
}

async function callOpenRouter(apiKey: string, lastUserMsg: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://inmonest.com',
      'X-Title': 'Inmonest',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: lastUserMsg },
      ],
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${errText}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// Verificar que la petición viene del propio portal (evitar abuso externo de la IA)
function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin') ?? ''
  const host = req.headers.get('host') ?? ''
  // En desarrollo local siempre permitir
  if (process.env.NODE_ENV !== 'production') return true
  // En producción solo aceptar desde el mismo dominio
  const allowed = ['https://inmonest.com', 'https://www.inmonest.com']
  return allowed.some((o) => origin.startsWith(o)) || host.includes('inmonest.com')
}

export async function POST(req: NextRequest) {
  // Bloquear peticiones externas (bots, scrapers, abuso de IA)
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: { messages?: Array<{ role: string; content: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const messages = body.messages ?? []
  if (!messages.length) return NextResponse.json({ error: 'Sin mensajes' }, { status: 422 })

  // Limitar longitud de cada mensaje para evitar tokens excesivos
  const MAX_MSG_LEN = 500
  const sanitized = messages.map((m) => ({
    ...m,
    content: typeof m.content === 'string' ? m.content.slice(0, MAX_MSG_LEN) : '',
  }))

  const lastUser = [...sanitized].reverse().find((m) => m.role === 'user')
  if (!lastUser) return NextResponse.json({ error: 'Sin mensaje de usuario' }, { status: 422 })

  const recent = sanitized.slice(-6)
  const geminiKey = getGeminiKey()
  const openrouterKey = getOpenRouterKey()

  // ── Intento 1: Gemini ──────────────────────────────────────
  if (geminiKey) {
    try {
      const raw = await callGemini(geminiKey, lastUser.content, recent)
      return NextResponse.json({ ok: true, filters: parseFilters(raw), raw })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[chat/route] Gemini falló, probando fallback OpenRouter:', msg)
    }
  }

  // ── Intento 2: OpenRouter (fallback) ───────────────────────
  if (openrouterKey) {
    try {
      const raw = await callOpenRouter(openrouterKey, lastUser.content)
      return NextResponse.json({ ok: true, filters: parseFilters(raw), raw })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[chat/route] OpenRouter también falló:', msg)
    }
  }

  // ── Sin opciones disponibles ───────────────────────────────
  if (!geminiKey && !openrouterKey) {
    console.error('[chat/route] No hay ninguna API key configurada (GOOGLE_AI_API_KEY, OPENROUTER_API_KEY)')
  }

  return NextResponse.json(
    { error: 'El asistente IA no está disponible ahora mismo. Inténtalo de nuevo.' },
    { status: 503 }
  )
}


