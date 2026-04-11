import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? ''

const SYSTEM_PROMPT = `Eres un asistente de búsqueda de pisos para el portal MiviviendaLibre.
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

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Chat IA no configurado' }, { status: 503 })
  }

  let body: { messages?: Array<{ role: string; content: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const messages = body.messages ?? []
  if (!messages.length) {
    return NextResponse.json({ error: 'Sin mensajes' }, { status: 422 })
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser) {
    return NextResponse.json({ error: 'Sin mensaje de usuario' }, { status: 422 })
  }

  // Construir historial de conversación (últimos 6 turnos)
  const recent = messages.slice(-6)

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
    })

    // El historial de Gemini debe empezar con rol 'user' y alternar user/model.
    // Filtramos el mensaje de bienvenida del asistente que encabeza la lista.
    const rawHistory = recent.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    // Descartar entradas iniciales con rol 'model' (la bienvenida del widget)
    while (rawHistory.length > 0 && rawHistory[0].role === 'model') {
      rawHistory.shift()
    }

    const chat = model.startChat({ history: rawHistory })

    const result = await chat.sendMessage(lastUser.content)
    const raw = result.response.text().trim()

    // Intentar parsear el JSON de vuelta
    let filters: Record<string, unknown> = {}
    try {
      // Quitar posible bloque ```json ... ```
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      filters = JSON.parse(clean)
    } catch {
      filters = { raw }
    }

    return NextResponse.json({ ok: true, filters, raw })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] Gemini error:', msg)
    return NextResponse.json({ error: `Error en la IA: ${msg}` }, { status: 500 })
  }
}
