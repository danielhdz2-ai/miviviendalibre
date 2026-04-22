/**
 * /api/cron/generate-descriptions
 *
 * Cron job que genera ai_description para listings publicados que aún no la tengan.
 * Se ejecuta cada hora según vercel.json.
 * Procesa hasta 20 listings por ejecución para no exceder el timeout de Vercel.
 *
 * Seguridad: solo acepta llamadas desde el propio Vercel cron
 * (header Authorization: Bearer CRON_SECRET) o sin header en local.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAiDescription } from '@/lib/ai-description'

const BATCH_SIZE = 20
const DELAY_MS   = 400

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function GET(req: NextRequest) {
  // ── Auth: CRON_SECRET de Vercel ──────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  if (!supabaseUrl || !supabaseKey || !openrouterKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const sb = createClient(supabaseUrl, supabaseKey)

  // ── Obtener listings sin ai_description ─────────────────────────────────
  const { data: listings, error } = await sb
    .from('listings')
    .select('id, title, description, operation, city, district, province, price_eur, bedrooms, bathrooms, area_m2')
    .eq('status', 'published')
    .or('ai_description.is.null,ai_description.eq.')
    .order('created_at', { ascending: false })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[cron/generate-descriptions] Error leyendo listings:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Todos los listings tienen descripción' })
  }

  let ok = 0
  let fail = 0

  for (const listing of listings) {
    const aiDesc = await generateAiDescription(listing, openrouterKey)

    if (!aiDesc) {
      fail++
      await sleep(DELAY_MS)
      continue
    }

    const { error: updateErr } = await sb
      .from('listings')
      .update({ ai_description: aiDesc })
      .eq('id', listing.id)

    if (updateErr) {
      console.error(`[cron/generate-descriptions] No se pudo guardar ${listing.id}:`, updateErr.message)
      fail++
    } else {
      ok++
    }

    await sleep(DELAY_MS)
  }

  console.log(`[cron/generate-descriptions] ✅ ${ok} guardados, ❌ ${fail} errores`)
  return NextResponse.json({ ok: true, processed: ok, errors: fail, total: listings.length })
}
