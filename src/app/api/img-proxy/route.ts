import { NextRequest, NextResponse } from 'next/server'

// Bloquear IPs privadas / locales para prevenir SSRF
const PRIVATE_IP_RE =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|::1|fc00:|fe80:)/i

function isSafeUrl(rawUrl: string): boolean {
  try {
    const { protocol, hostname } = new URL(rawUrl)
    // Solo HTTPS
    if (protocol !== 'https:') return false
    // Bloquear hostnames privados
    if (PRIVATE_IP_RE.test(hostname)) return false
    // Bloquear metadata cloud (AWS, GCP, Azure)
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return false
    return true
  } catch {
    return false
  }
}

// Referer por dominio — evita el bloqueo de hotlinking
const REFERER_MAP: Record<string, string> = {
  'tucasa.com':     'https://www.tucasa.com/',
  'apinmo.com':     'https://www.tucasa.com/',
  'fotocasa.es':    'https://www.fotocasa.es/',
  'habitaclia.com': 'https://www.habitaclia.com/',
  'mitula.es':      'https://www.mitula.es/',
  'trovit.es':      'https://encontr.es/',
  'kelify.com':     'https://www.kelify.com/',
}

function getReferer(url: string): string | undefined {
  try {
    const { hostname } = new URL(url)
    const domain = hostname.replace(/^www\./, '')
    return REFERER_MAP[domain]
  } catch {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  if (!isSafeUrl(imageUrl)) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        ...(getReferer(imageUrl) ? { Referer: getReferer(imageUrl)! } : {}),
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      // Propagar el código real del upstream (404, 403, etc.)
      // Cachear 404 para no repetir la petición durante 1h
      const headers: Record<string, string> = {}
      if (response.status === 404) {
        headers['Cache-Control'] = 'public, max-age=3600'
      }
      return new NextResponse('Image not found', { status: response.status, headers })
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'

    // Solo permitir tipos de imagen
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Browser: 1 día. CDN Vercel Edge: 7 días → evita reinvocar la función
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        // Evitar que Google indexe URLs del proxy
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    return new NextResponse('Failed to fetch image', { status: isTimeout ? 504 : 502 })
  }
}
