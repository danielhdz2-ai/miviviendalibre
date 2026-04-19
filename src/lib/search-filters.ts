/**
 * search-filters.ts
 * Filtros pro para Supabase: características JSONB, estado, planta, energía, fecha.
 *
 * USO en lib/listings.ts — añadir al final de los bloques de filtros:
 *   import { applyProFilters, parseProParams } from '@/lib/search-filters'
 *   ...
 *   const pro = parseProParams(params)
 *   countQuery = applyProFilters(countQuery, pro)
 *   dataQuery  = applyProFilters(dataQuery, pro)
 */

// ── Tipos ────────────────────────────────────────────────────────────────
export interface ProSearchParams {
  /** 'obra_nueva' | 'buen_estado' | 'a_reformar' */
  estado?: string
  /** ['ascensor','piscina','garaje',...] */
  caract?: string[]
  /** 'ultima' | 'intermedia' | 'bajos' */
  planta?: string
  /** 'alta' | 'media' | 'baja' */
  energia?: string
  /** ['plano','visita_virtual'] */
  multimedia?: string[]
  /** '48h' | 'semana' | 'mes' */
  fecha_pub?: string
}

// Extiende SearchParams de types/listings.ts para los nuevos params de URL
export interface ExtendedSearchParams {
  estado?: string
  caract?: string          // coma-separado en URL
  planta?: string
  energia?: string
  multimedia?: string      // coma-separado en URL
  fecha_pub?: string
}

// ── Mapeo de keys URL → keys en features JSONB ───────────────────────────
// Las features se guardan como Record<string, string> en Supabase.
// El scraper debe escribir p.ej. features.ascensor = 'true'
const CARACT_KEY: Record<string, string> = {
  aire_acondicionado: 'aire_acondicionado',
  armarios:           'armarios_empotrados',
  ascensor:           'ascensor',
  terraza:            'terraza',
  exterior:           'exterior',
  garaje:             'garaje',
  jardin:             'jardin',
  piscina:            'piscina',
  trastero:           'trastero',
  accesible:          'accesible',
  lujo:               'lujo',
  vistas_mar:         'vistas_mar',
  plano:              'plano',
  visita_virtual:     'visita_virtual',
}

// Recorte de tiempo para fecha_pub
function cutoff(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString()
}
const H = 3_600_000
const FECHA_CUTOFF: Record<string, string> = {
  '48h':   cutoff(48 * H),
  semana:  cutoff(7 * 24 * H),
  mes:     cutoff(30 * 24 * H),
}

// ── Función principal ────────────────────────────────────────────────────
/**
 * Aplica filtros pro a un query builder de Supabase.
 * Funciona tanto para conteos (head: true) como para queries de datos.
 *
 * Los filtros JSONB usan:
 *   - .contains() → features @> '{"key":"true"}'
 *   - .filter()   → features->>'key' = 'value'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyProFilters<Q extends Record<string, any>>(query: Q, params: ProSearchParams): Q {

  // Estado → features->>'estado' = 'obra_nueva'
  if (params.estado) {
    query = (query as any).filter('features->>estado', 'eq', params.estado)
  }

  // Características → features @> '{"ascensor":"true"}'
  if (params.caract?.length) {
    for (const c of params.caract) {
      const key = CARACT_KEY[c] ?? c
      query = (query as any).contains('features', { [key]: 'true' })
    }
  }

  // Planta → features->>'planta' = 'ultima'
  if (params.planta) {
    query = (query as any).filter('features->>planta', 'eq', params.planta)
  }

  // Energía → features->>'energia' = 'alta'
  if (params.energia) {
    query = (query as any).filter('features->>energia', 'eq', params.energia)
  }

  // Multimedia → features @> '{"plano":"true"}'
  if (params.multimedia?.length) {
    for (const m of params.multimedia) {
      const key = CARACT_KEY[m] ?? m
      query = (query as any).contains('features', { [key]: 'true' })
    }
  }

  // Fecha de publicación → published_at >= ISO
  if (params.fecha_pub && FECHA_CUTOFF[params.fecha_pub]) {
    query = (query as any).gte('published_at', FECHA_CUTOFF[params.fecha_pub])
  }

  return query
}

/**
 * Parsea los params extendidos de URL (string) a ProSearchParams tipado.
 * Usar en pisos/page.tsx junto a los params ya existentes.
 */
export function parseProParams(params: ExtendedSearchParams): ProSearchParams {
  return {
    estado:     params.estado     || undefined,
    caract:     params.caract     ? params.caract.split(',').filter(Boolean)     : undefined,
    planta:     params.planta     || undefined,
    energia:    params.energia    || undefined,
    multimedia: params.multimedia ? params.multimedia.split(',').filter(Boolean) : undefined,
    fecha_pub:  params.fecha_pub  || undefined,
  }
}
