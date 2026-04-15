import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(url, key)

  // Test A: select simple sin join
  const a = await db.from('listings').select('id, operation, status', { count: 'exact' }).range(0, 3)

  // Test B: select con join listing_images
  const b = await db.from('listings').select('id, listing_images(id, external_url)', { count: 'exact' }).range(0, 3)

  // Test C: select completo igual que LIST_SELECT
  const LIST_SELECT = 'id, origin, operation, title, price_eur, province, city, district, postal_code, lat, lng, bedrooms, bathrooms, area_m2, source_portal, is_particular, particular_confidence, ranking_score, turbo_until, status, views_count, published_at, created_at, is_bank, bank_entity, features, advertiser_name, source_external_id, listing_images(id, storage_path, external_url, position)'
  const c = await db.from('listings').select(LIST_SELECT, { count: 'exact' }).range(0, 3)

  return NextResponse.json({
    A_simple:    { count: a.count, rows: a.data?.length, error: a.error?.message },
    B_con_join:  { count: b.count, rows: b.data?.length, error: b.error?.message },
    C_LIST_SELECT: { count: c.count, rows: c.data?.length, error: c.error?.message },
  })
}


