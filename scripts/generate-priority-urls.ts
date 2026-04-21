/**
 * generate-priority-urls.ts
 *
 * Consulta Supabase y genera /public/urls-prioritarias.txt con las
 * URLs estáticas principales + los 50 listings activos más recientes.
 *
 * Uso: npx tsx scripts/generate-priority-urls.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const BASE_URL = 'https://inmonest.com'

const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/vender-casa`,
  `${BASE_URL}/agencias`,
  `${BASE_URL}/gestoria`,
  `${BASE_URL}/pisos`,
  `${BASE_URL}/publicar-anuncio`,
  `${BASE_URL}/madrid/alquiler-particulares`,
  `${BASE_URL}/barcelona/alquiler-particulares`,
  `${BASE_URL}/valencia/alquiler-particulares`,
  `${BASE_URL}/sevilla/alquiler-particulares`,
  `${BASE_URL}/malaga/alquiler-particulares`,
  `${BASE_URL}/madrid/pisos`,
  `${BASE_URL}/barcelona/pisos`,
  `${BASE_URL}/madrid/alquiler-sin-agencia`,
  `${BASE_URL}/barcelona/alquiler-sin-agencia`,
  `${BASE_URL}/madrid/contrato-alquiler`,
  `${BASE_URL}/barcelona/contrato-alquiler`,
  `${BASE_URL}/blog/vender-piso-sin-comisiones`,
]

async function main() {
  console.log('🔗 Generando urls-prioritarias.txt…')

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data, error } = await sb
    .from('listings')
    .select('id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('❌ Error al leer listings:', error.message)
    process.exit(1)
  }

  const listingUrls = (data ?? []).map((l: { id: string }) => `${BASE_URL}/pisos/${l.id}`)

  const all = [...STATIC_URLS, ...listingUrls]
  const content = all.join('\n') + '\n'

  const outPath = resolve(process.cwd(), 'public', 'urls-prioritarias.txt')
  writeFileSync(outPath, content, 'utf-8')

  console.log(`✅ Generado: public/urls-prioritarias.txt`)
  console.log(`   ${STATIC_URLS.length} URLs estáticas + ${listingUrls.length} listings = ${all.length} total`)
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
