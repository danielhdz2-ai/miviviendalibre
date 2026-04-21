import { MetadataRoute } from 'next'

const BASE_URL = 'https://inmonest.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // API routes
          '/api/',
          // Auth & private flows
          '/mi-cuenta/',
          '/mis-documentos',
          '/login',
          '/registro',
          '/auth/',
          // Admin
          '/admin/',
          // Post-payment confirmation pages (no SEO value, require session)
          '/gestoria/gracias',
          '/gestoria/error',
          '/gestoria/carga-documentos',
          // Turbo post-payment pages (noindex handled via metadata in each page)
          // Note: NOT disallowed here so Google can read the noindex meta tag
          // Wizard / multi-step forms
          '/publicar',
          '/publicar/',
          // Debug
          '/debug/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
