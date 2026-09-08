import { MetadataRoute } from 'next'

const BASE_URL = 'https://inmonest.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/img-proxy'],
        disallow: [
          // API routes (img-proxy allowed so Google can fetch images without GSC "blocked" noise)
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
          // Informes SEO internos (no indexar)
          '/gestoria-indexacion-report.json',
          '/urls-prioritarias.txt',
          '/urls-prioritarias.csv',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
