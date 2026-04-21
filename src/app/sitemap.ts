import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://inmonest.com'

const CIUDADES = [
  'madrid',
  'barcelona',
  'valencia',
  'sevilla',
  'malaga',
  'bilbao',
  'zaragoza',
  'alicante',
]

// Páginas estáticas principales
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL,                           lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE_URL}/pisos`,                lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE_URL}/gestoria`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
  { url: `${BASE_URL}/publicar-anuncio`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/vender-casa`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/agencias`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${BASE_URL}/aviso-legal`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  { url: `${BASE_URL}/privacidad`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  { url: `${BASE_URL}/cookies`,              lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  { url: `${BASE_URL}/seguridad`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  { url: `${BASE_URL}/contacto`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
]

// Páginas SEO de contratos de arras por ciudad
const ARRAS_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/contrato-arras`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.85,
}))

// Páginas SEO de contratos de alquiler por ciudad
const ALQUILER_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/contrato-alquiler`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.85,
}))

// Páginas SEO de alquiler sin agencia por ciudad
const ALQUILER_SIN_AGENCIA_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/alquiler-sin-agencia`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.85,
}))

// Páginas SEO de vender piso sin comisión por ciudad
const VENDER_PISO_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/vender-piso`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.85,
}))

// Páginas SEO de pisos por ciudad
const PISOS_CIUDAD_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/pisos`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.9,
}))

// Páginas SEO de alquiler de particulares por ciudad
const ALQUILER_PARTICULARES_PAGES: MetadataRoute.Sitemap = CIUDADES.map((ciudad) => ({
  url: `${BASE_URL}/${ciudad}/alquiler-particulares`,
  lastModified: new Date(),
  changeFrequency: 'daily' as const,
  priority: 0.92,
}))

async function getListingUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('status', 'published')
      .limit(10000)

    if (error || !data) return []

    return data.map((listing) => ({
      url: `${BASE_URL}/pisos/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listingUrls = await getListingUrls()

  return [
    ...STATIC_PAGES,
    ...ARRAS_PAGES,
    ...ALQUILER_PAGES,
    ...ALQUILER_SIN_AGENCIA_PAGES,
    ...VENDER_PISO_PAGES,
    ...PISOS_CIUDAD_PAGES,
    ...ALQUILER_PARTICULARES_PAGES,
    ...listingUrls,
  ]
}
