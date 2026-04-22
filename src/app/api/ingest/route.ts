import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { detectParticular } from '@/lib/detect-particular'
import { generateAiDescription } from '@/lib/ai-description'

interface IngestItem {
  source: string
  external_id: string
  url: string
  title: string
  description: string
  price: number | null
  city: string
  operation: 'rent' | 'sale'
  image_url: string | null
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret')
  const validSecret = process.env.SCRAPER_SECRET?.trim()

  if (!validSecret || secret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { listings: IngestItem[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { listings } = body
  if (!Array.isArray(listings) || listings.length === 0) {
    return NextResponse.json({ error: 'No listings provided' }, { status: 400 })
  }

  const supabase = getAdminClient()
  let inserted = 0
  let skipped = 0

  for (const item of listings) {
    if (!item.title || !item.city || !item.external_id) continue

    const detection = detectParticular(item.title, item.description ?? '')

    // upsert por source_external_id — si ya existe lo ignora
    const { error } = await supabase.from('listings').upsert(
      {
        origin: 'external',
        operation: item.operation ?? 'rent',
        title: String(item.title).slice(0, 200),
        description: item.description ? String(item.description).slice(0, 3000) : null,
        price_eur: item.price ?? null,
        city: String(item.city),
        province: String(item.city),
        source_portal: item.source,
        source_external_id: item.external_id,
        source_url: item.url,
        is_particular: detection.is_particular,
        particular_confidence: detection.confidence,
        ranking_score: Math.round(detection.confidence * 85),
        status: 'published',
        published_at: new Date().toISOString(),
      },
      { onConflict: 'source_external_id', ignoreDuplicates: true }
    )

    if (error) {
      skipped++
    } else {
      // Insertar imagen si existe y si es nuevo
      if (item.image_url) {
        const { data: inserted_row } = await supabase
          .from('listings')
          .select('id')
          .eq('source_external_id', item.external_id)
          .single()

        if (inserted_row?.id) {
          const { data: existingImg } = await supabase
            .from('listing_images')
            .select('id')
            .eq('listing_id', inserted_row.id)
            .limit(1)
            .single()

          if (!existingImg) {
            await supabase.from('listing_images').insert({
              listing_id: inserted_row.id,
              external_url: item.image_url,
              position: 0,
            })
          }
        }
      }
      // Genera descripción IA en background para el listing recién insertado
      if (process.env.OPENROUTER_API_KEY) {
        const { data: newRow } = await supabase
          .from('listings')
          .select('id, title, description, operation, city, district, province, price_eur, bedrooms, bathrooms, area_m2')
          .eq('source_external_id', item.external_id)
          .is('ai_description', null)
          .single()
        if (newRow) {
          void generateAiDescription(newRow, process.env.OPENROUTER_API_KEY).then(async (desc) => {
            if (desc) {
              await supabase.from('listings').update({ ai_description: desc }).eq('id', newRow.id)
            }
          })
        }
      }
      inserted++
    }
  }

  return NextResponse.json({ ok: true, inserted, skipped })
}
