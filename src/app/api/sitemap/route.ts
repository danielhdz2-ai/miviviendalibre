import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BASE_URL = 'https://inmonest.com'
const MAX_LISTINGS = 49_000

const CIUDADES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza',
  'malaga', 'murcia', 'bilbao', 'alicante', 'granada',
]

/** Escapa los 5 caracteres reservados de XML */
function xe(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Concatena BASE_URL + path, elimina espacios y escapa para XML */
function u(path: string): string {
  return xe(`${BASE_URL}${path}`.replace(/\s+/g, ''))
}

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq: string
  priority: number
}

function xmlEntry({ loc, lastmod, changefreq, priority }: SitemapEntry): string {
  const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return (
    `  <url>\n` +
    `    <loc>${loc}</loc>${lm}\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority.toFixed(1)}</priority>\n` +
    `  </url>`
  )
}

export async function GET() {
  const supabase = await createClient()

  let listings: Array<{ id: string; updated_at: string | null; published_at: string | null }> = []
  let from = 0
  const PAGE = 1000

  while (listings.length < MAX_LISTINGS) {
    const { data, error } = await supabase
      .from('listings')
      .select('id, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, from + PAGE - 1)

    if (error || !data || data.length === 0) break
    listings = listings.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const today = new Date().toISOString().slice(0, 10)

  const staticEntries = [
    xmlEntry({ loc: xe(BASE_URL),               lastmod: today, changefreq: 'daily',   priority: 1.0 }),
    xmlEntry({ loc: u('/pisos'),                lastmod: today, changefreq: 'hourly',  priority: 1.0 }),
    xmlEntry({ loc: u('/pisos?operacion=rent'), lastmod: today, changefreq: 'daily',   priority: 0.9 }),
    xmlEntry({ loc: u('/pisos?operacion=sale'), lastmod: today, changefreq: 'daily',   priority: 0.9 }),
    xmlEntry({ loc: u('/publicar'),                             changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/publicar-anuncio'),                     changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/vender-casa'),                          changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/gestoria'),                             changefreq: 'monthly', priority: 0.6 }),
    xmlEntry({ loc: u('/agencias'),                             changefreq: 'monthly', priority: 0.6 }),
    xmlEntry({ loc: u('/contacto'),                             changefreq: 'monthly', priority: 0.5 }),
  ]

  const ciudadEntries = CIUDADES.flatMap((slug) => [
    xmlEntry({ loc: u(`/pisos?ciudad=${slug}&operacion=rent`), lastmod: today, changefreq: 'daily', priority: 0.9 }),
    xmlEntry({ loc: u(`/pisos?ciudad=${slug}&operacion=sale`), lastmod: today, changefreq: 'daily', priority: 0.8 }),
  ])

  const listingEntries = listings.map((l) => {
    const lm = new Date(l.updated_at ?? l.published_at ?? Date.now())
      .toISOString()
      .slice(0, 10)
    return xmlEntry({ loc: u(`/pisos/${l.id}`), lastmod: lm, changefreq: 'weekly', priority: 0.7 })
  })

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...staticEntries, ...ciudadEntries, ...listingEntries].join('\n') +
    '\n</urlset>'

  // Red de seguridad: escapar cualquier & que NO esté ya seguido de una
  // entidad XML válida (amp; lt; gt; quot; apos;) ni de un # (referencias numéricas).
  // Esto corrige el error "EntityRef: expecting ';'" sin duplicar escapes ya correctos.
  const safeXml = xml.replace(/&(?!(amp|lt|gt|quot|apos|#);|#\d+;)/g, '&amp;')

  return new Response(safeXml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
