import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Límite de seguridad por petición
const MAX_LISTINGS_PER_FEED = 500

interface ParsedListing {
  referencia: string
  titulo: string
  descripcion?: string
  operacion: 'sale' | 'rent'
  precio?: number
  provincia?: string
  localidad?: string
  distrito?: string
  codigo_postal?: string
  superficie?: number
  habitaciones?: number
  banos?: number
  fotos: string[]
}

/**
 * Parser de feed XML estándar inmobiliario español (InmoFeed / AMERIA)
 * Acepta variaciones de nombres de campo habituales en CRMs españoles
 */
function parseXmlFeed(xml: string, agencia: string): ParsedListing[] {
  const listings: ParsedListing[] = []

  // Extraer bloques de inmueble (tolerante a distintos nombres de nodo raíz)
  const blockRe = /<(?:inmueble|property|inmuebles\/inmueble|propiedad)[^>]*>([\s\S]*?)<\/(?:inmueble|property|propiedad)>/gi
  let match: RegExpExecArray | null

  while ((match = blockRe.exec(xml)) !== null && listings.length < MAX_LISTINGS_PER_FEED) {
    const block = match[1]

    const get = (tags: string[]): string => {
      for (const tag of tags) {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
        if (m) return (m[1] ?? m[2] ?? '').trim()
      }
      return ''
    }

    const getNum = (tags: string[]): number | undefined => {
      const v = parseFloat(get(tags).replace(/[^\d.]/g, ''))
      return isNaN(v) ? undefined : v
    }

    const getPhotos = (): string[] => {
      const fotosRe = /<(?:foto|imagen|image|photo|src)[^>]*><!?\[CDATA\[(https?[^\]]+)\]\]>|<(?:foto|imagen|image|photo|src)[^>]*>(https?[^<]+)<\/(?:foto|imagen|image|photo|src)>/gi
      const photos: string[] = []
      let fm: RegExpExecArray | null
      while ((fm = fotosRe.exec(block)) !== null) {
        const url = (fm[1] ?? fm[2] ?? '').trim()
        if (url.startsWith('http')) photos.push(url)
      }
      return [...new Set(photos)].slice(0, 10)
    }

    const ref = get(['referencia', 'ref', 'id', 'codigo', 'code'])
    const titulo = get(['titulo', 'title', 'nombre', 'name', 'descripcion_corta', 'short_description'])
    if (!ref || !titulo) continue

    const opRaw = get(['operacion', 'operation', 'tipo_operacion', 'transaction']).toLowerCase()
    const operacion: 'sale' | 'rent' =
      opRaw.includes('alquil') || opRaw.includes('rent') ? 'rent' : 'sale'

    listings.push({
      referencia: ref,
      titulo: titulo.slice(0, 200),
      descripcion: get(['descripcion', 'description', 'observaciones', 'notes'])?.slice(0, 1500) || undefined,
      operacion,
      precio: getNum(['precio', 'price', 'importe']),
      provincia: get(['provincia', 'province', 'region'])?.slice(0, 100) || undefined,
      localidad: get(['localidad', 'ciudad', 'city', 'municipio'])?.slice(0, 100) || undefined,
      distrito: get(['distrito', 'barrio', 'zona', 'district'])?.slice(0, 100) || undefined,
      codigo_postal: get(['codigo_postal', 'cp', 'postal_code', 'zip'])?.slice(0, 10) || undefined,
      superficie: getNum(['superficie', 'area', 'metros', 'm2', 'size']),
      habitaciones: getNum(['habitaciones', 'dormitorios', 'bedrooms', 'rooms']),
      banos: getNum(['banos', 'aseos', 'bathrooms']),
      fotos: getPhotos(),
    })
  }

  return listings
}

export async function POST(req: NextRequest) {
  // Autenticacion: solo agencias registradas o service_role interno
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''

  let xmlContent: string
  let agencia: string = user.id

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    const feedUrl = body.feed_url as string | undefined
    agencia = body.agencia ?? user.id

    if (!feedUrl || !feedUrl.startsWith('http')) {
      return NextResponse.json({ error: 'feed_url inválida' }, { status: 400 })
    }

    // Descargar el feed desde la URL
    const feedRes = await fetch(feedUrl, {
      headers: { 'User-Agent': 'MiViviendaLibre-FeedBot/1.0' },
      signal: AbortSignal.timeout(15000),
    })

    if (!feedRes.ok) {
      return NextResponse.json({ error: `No se pudo descargar el feed: HTTP ${feedRes.status}` }, { status: 422 })
    }

    xmlContent = await feedRes.text()
  } else {
    // XML enviado directamente en el body
    xmlContent = await req.text()
  }

  if (!xmlContent || xmlContent.length < 50) {
    return NextResponse.json({ error: 'Feed vacío o inválido' }, { status: 422 })
  }

  const parsed = parseXmlFeed(xmlContent, agencia)

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No se encontraron inmuebles en el feed' }, { status: 422 })
  }

  // Insertar/actualizar en Supabase en lotes de 50
  const BATCH = 50
  let inserted = 0
  let errors = 0

  for (let i = 0; i < parsed.length; i += BATCH) {
    const batch = parsed.slice(i, i + BATCH).map(l => ({
      origin: 'external',
      status: 'published',
      is_particular: false,
      owner_user_id: user.id,
      operation: l.operacion,
      title: l.titulo,
      description: l.descripcion ?? null,
      price_eur: l.precio ?? null,
      province: l.provincia ?? null,
      city: l.localidad ?? null,
      district: l.distrito ?? null,
      postal_code: l.codigo_postal ?? null,
      area_m2: l.superficie ? Math.round(l.superficie) : null,
      bedrooms: l.habitaciones ? Math.round(l.habitaciones) : null,
      bathrooms: l.banos ? Math.round(l.banos) : null,
      source_portal: `agencia_${agencia.slice(0, 20)}`,
      source_url: null,
      source_external_id: `${agencia}_${l.referencia}`,
      published_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('listings')
      .upsert(batch, { onConflict: 'source_portal,source_external_id', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error('Feed upsert error:', error.message)
      errors += batch.length
    } else {
      inserted += data?.length ?? 0
    }
  }

  return NextResponse.json({
    ok: true,
    parsed: parsed.length,
    inserted,
    errors,
  })
}
