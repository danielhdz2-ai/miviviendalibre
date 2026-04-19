import { createClient } from '@supabase/supabase-js'
import { searchListings } from '@/lib/listings'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get('x-debug-token') ?? req.nextUrl.searchParams.get('token') ?? ''
  const adminEmail = process.env.CONTACT_NOTIFY_EMAIL ?? ''
  return token.length > 0 && token === adminEmail
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(url, key)

  // Test 1: directo sin filtros
  const t1 = await db.from('listings').select('id', { count: 'exact', head: true })

  // Test 2: directo con operation=sale
  const t2 = await db.from('listings').select('id', { count: 'exact', head: true }).eq('operation', 'sale')

  // Test 3: searchListings sin filtros
  const r3 = await searchListings({})

  // Test 4: searchListings con operacion=sale (igual que hace /pisos?operacion=sale)
  const r4 = await searchListings({ operacion: 'sale' })

  // Test 5: searchListings con ordenar=relevancia (igual que la página)
  const r5 = await searchListings({ operacion: 'sale', ordenar: 'relevancia' })

  return NextResponse.json({
    t1_directo_total:    { count: t1.count, error: t1.error?.message },
    t2_directo_sale:     { count: t2.count, error: t2.error?.message },
    t3_search_vacio:     { total: r3.total, rows: r3.listings.length },
    t4_search_sale:      { total: r4.total, rows: r4.listings.length },
    t5_search_sale_rel:  { total: r5.total, rows: r5.listings.length },
  })
}




