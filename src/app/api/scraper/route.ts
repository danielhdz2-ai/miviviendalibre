import { NextRequest, NextResponse } from 'next/server'
import { scrapeWallapop } from '@/lib/scraper/wallapop'
import { scrapeMilanuncios } from '@/lib/scraper/milanuncios'
import { detectParticular } from '@/lib/detect-particular'

// Supabase Admin client (service role) para insertar sin RLS
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: llamado por Vercel Cron o manualmente con ?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  // Vercel Cron envía este header automáticamente
  const isCronCall = req.headers.get('x-vercel-cron') === '1'

  const validSecret = process.env.SCRAPER_SECRET
  const isAuthorized = isCronCall || (validSecret && secret === validSecret)

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const stats = { wallapop: 0, milanuncios: 0, inserted: 0, skipped: 0 }

  try {
    // 1. Scrape ambas fuentes en paralelo
    const [wallapopItems, milanunciosItems] = await Promise.allSettled([
      scrapeWallapop(),
      scrapeMilanuncios(),
    ])

    const allItems = [
      ...(wallapopItems.status === 'fulfilled' ? wallapopItems.value : []),
      ...(milanunciosItems.status === 'fulfilled' ? milanunciosItems.value : []),
    ]

    stats.wallapop = wallapopItems.status === 'fulfilled' ? wallapopItems.value.length : 0
    stats.milanuncios = milanunciosItems.status === 'fulfilled' ? milanunciosItems.value.length : 0

    // 2. Insertar en Supabase, saltando duplicados por source_external_id
    for (const item of allItems) {
      const detection = detectParticular(item.title, item.description)

      const source = item.id.startsWith('wallapop') ? 'wallapop' : 'milanuncios'

      const { error } = await supabase.from('listings').insert({
        origin: 'external',
        operation: item.operation,
        title: item.title.slice(0, 200),
        description: item.description.slice(0, 3000),
        price_eur: item.price,
        city: item.city,
        province: item.city,
        source_portal: source,
        source_external_id: item.id,
        source_url: item.url,
        is_particular: detection.isParticular,
        particular_confidence: detection.confidence,
        ranking_score: Math.round(detection.confidence * 80),
        status: 'published',
        published_at: new Date().toISOString(),
      })

      // Insertar imagen si existe
      if (!error && item.image_url) {
        // Obtener el id del listing recién insertado
        const { data: inserted } = await supabase
          .from('listings')
          .select('id')
          .eq('source_external_id', item.id)
          .single()

        if (inserted?.id) {
          await supabase.from('listing_images').insert({
            listing_id: inserted.id,
            external_url: item.image_url,
            position: 0,
          })
        }
        stats.inserted++
      } else if (error?.code === '23505') {
        // Clave duplicada — ya existía
        stats.skipped++
      } else if (!error) {
        stats.inserted++
      }
    }

    return NextResponse.json({
      ok: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido', stats },
      { status: 500 }
    )
  }
}
