/**
 * src/app/sitemap.xml/route.ts
 *
 * Route handler que genera el sitemap.xml manualmente.
 * Toma precedencia sobre src/app/sitemap.ts (metadata route) para /sitemap.xml.
 * Razones para usar route handler en vez del API de Next.js:
 *  - Control explícito del Content-Type: text/xml
 *  - Escapado XML garantizado (Next.js no siempre escapa & en metadata routes)
 *  - Sin espacios ni caracteres inesperados en las URLs
 */

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BASE_URL = 'https://inmonest.com'
const MAX_LISTINGS = 49_000

const CIUDADES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza',
  'malaga', 'murcia', 'bilbao', 'alicante', 'granada',
]

/** Escapa los 5 caracteres reservados de XML. */
function xe(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Construye una URL sin espacios ni saltos de línea y la escapa para XML.
 * path debe empezar por '/' o estar vacío.
 */
function u(path: string): string {
  // Eliminamos CUALQUIER espacio o salto antes de escapar
  const clean = `${BASE_URL}${path}`.replace(/\s+/g, '')
  return xe(clean)
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

  // ── Obtener todos los anuncios publicados paginando de 1000 en 1000 ──────
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

  // ── Páginas estáticas ────────────────────────────────────────────────────
  const staticEntries = [
    xmlEntry({ loc: xe(BASE_URL),              lastmod: today, changefreq: 'daily',   priority: 1.0 }),
    xmlEntry({ loc: u('/pisos'),               lastmod: today, changefreq: 'hourly',  priority: 1.0 }),
    xmlEntry({ loc: u('/pisos?operacion=rent'),lastmod: today, changefreq: 'daily',   priority: 0.9 }),
    xmlEntry({ loc: u('/pisos?operacion=sale'),lastmod: today, changefreq: 'daily',   priority: 0.9 }),
    xmlEntry({ loc: u('/publicar'),                            changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/publicar-anuncio'),                    changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/vender-casa'),                         changefreq: 'monthly', priority: 0.7 }),
    xmlEntry({ loc: u('/gestoria'),                            changefreq: 'monthly', priority: 0.6 }),
    xmlEntry({ loc: u('/agencias'),                            changefreq: 'monthly', priority: 0.6 }),
    xmlEntry({ loc: u('/contacto'),                            changefreq: 'monthly', priority: 0.5 }),
  ]

  // ── Páginas de búsqueda por ciudad ───────────────────────────────────────
  const ciudadEntries = CIUDADES.flatMap((slug) => [
    xmlEntry({ loc: u(`/pisos?ciudad=${slug}&operacion=rent`), lastmod: today, changefreq: 'daily', priority: 0.9 }),
    xmlEntry({ loc: u(`/pisos?ciudad=${slug}&operacion=sale`), lastmod: today, changefreq: 'daily', priority: 0.8 }),
  ])

  // ── Anuncios individuales ────────────────────────────────────────────────
  const listingEntries = listings.map((l) => {
    const lm = new Date(l.updated_at ?? l.published_at ?? Date.now())
      .toISOString()
      .slice(0, 10)
    return xmlEntry({ loc: u(`/pisos/${l.id}`), lastmod: lm, changefreq: 'weekly', priority: 0.7 })
  })

  const allEntries = [...staticEntries, ...ciudadEntries, ...listingEntries]

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allEntries.join('\n') +
    '\n</urlset>'

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
