import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inmonest.com'

const CIUDADES_PRINCIPALES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza',
  'malaga', 'murcia', 'bilbao', 'alicante', 'granada',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Obtener los últimos 1000 anuncios publicados
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1000)

  const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${BASE_URL}/pisos/${l.id}`,
    lastModified: new Date(l.updated_at ?? l.published_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const ciudadUrls: MetadataRoute.Sitemap = CIUDADES_PRINCIPALES.flatMap((ciudad) => [
    {
      url: `${BASE_URL}/pisos?ciudad=${ciudad}&operacion=rent&solo_particulares=true`,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pisos?ciudad=${ciudad}&operacion=sale&solo_particulares=true`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ])

  return [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pisos`,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/publicar`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...ciudadUrls,
    ...listingUrls,
  ]
}
