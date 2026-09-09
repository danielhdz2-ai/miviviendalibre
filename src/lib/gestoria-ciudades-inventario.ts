import { CIUDADES_PORTAL_SLUGS } from './ciudades-portal'
import { CONTRATO_ARRAS_PREMIUM } from './contrato-arras-premium-config'
import { CONTRATO_ALQUILER_PREMIUM } from './contrato-alquiler-premium-config'
import { CONTRATOS_INMOBILIARIOS_CIUDAD_SLUGS } from './contratos-inmobiliarios-ciudades'
import { formatPrecioDesde, formatPrecioEuro, getPrecioServicio } from './gestoria-catalogo'
import { precioLabel, precioLauInventarioLabel } from './gestoria-precios-ui'

export type CiudadRef = {
  slug: string
  nombre: string
}

export type LandingPorCiudad = {
  id: string
  nombre: string
  precioSlug?: string
  precioInfo?: string
  precioLauRango?: boolean
  href: (ciudad: string) => string
  ciudades: string[]
}

export type LandingGenerica = {
  slug: string
  nombre: string
  precioSlug?: string
  precioInfo?: string
  /** Ruta absoluta si no está bajo /gestoria/ */
  href?: string
}

export function getLandingPrecioDisplay(item: {
  precioSlug?: string
  precioInfo?: string
  precioLauRango?: boolean
}): string {
  if (item.precioInfo) return item.precioInfo
  if (item.precioLauRango) return precioLauInventarioLabel()
  if (item.precioSlug) {
    const p = getPrecioServicio(item.precioSlug)
    return p != null ? formatPrecioEuro(p) : 'Info'
  }
  return ''
}

const NOMBRES_EXTRA: Record<string, string> = {
  salamanca: 'Salamanca',
  valladolid: 'Valladolid',
  granada: 'Granada',
  coruna: 'A Coruña',
  palma: 'Palma de Mallorca',
  mallorca: 'Mallorca',
  asturias: 'Asturias',
  santander: 'Santander',
  vitoria: 'Vitoria',
  'san-sebastian': 'San Sebastián',
  donostia: 'San Sebastián',
}

export function getNombreCiudad(slug: string): string {
  return (
    CONTRATO_ARRAS_PREMIUM[slug]?.nombre ??
    CONTRATO_ALQUILER_PREMIUM[slug]?.nombre ??
    NOMBRES_EXTRA[slug] ??
    slug.charAt(0).toUpperCase() + slug.slice(1)
  )
}

export const CIUDADES_DESTACADAS: CiudadRef[] = [
  'madrid',
  'barcelona',
  'valencia',
  'sevilla',
  'malaga',
  'salamanca',
  'valladolid',
  'bilbao',
  'zaragoza',
  'alicante',
  'granada',
  'santander',
  'vitoria',
  'san-sebastian',
].map((slug) => ({ slug, nombre: getNombreCiudad(slug) }))

const CIUDADES_PORTAL = [...CIUDADES_PORTAL_SLUGS]

/** Evita /gestoria/gestoria cuando el slug del servicio es "gestoria" */
export function getServicioGuiaHref(slug: string): string {
  if (slug === 'gestoria') return '/gestoria'
  if (slug === 'contratos-inmobiliarios') return '/contratos-inmobiliarios'
  return `/gestoria/${slug}`
}

/** Solo ciudades con landing realmente construida para este tipo de página */
export function filterCiudadesLandingActiva(landingId: string, ciudades: string[]): string[] {
  if (landingId === 'alquiler-particulares') {
    return ciudades.filter((c) => (CIUDADES_PORTAL_SLUGS as readonly string[]).includes(c))
  }
  return ciudades
}

export const LANDINGS_GENERICAS: LandingGenerica[] = [
  {
    slug: 'contratos-inmobiliarios',
    nombre: 'Contratos Inmobiliarios (Hub España)',
    precioInfo: formatPrecioDesde('arras-penitenciales'),
    href: '/contratos-inmobiliarios',
  },
  { slug: 'asesoria-compra-piso', nombre: 'Asesoría Compra de Piso', precioSlug: 'compra-completa-reserva-escritura' },
  { slug: 'due-diligence-precompra', nombre: 'Due Diligence Pre-Compra', precioSlug: 'pack-due-diligence-precompra' },
  { slug: 'asesoramiento-arras-venta', nombre: 'Asesoramiento Arras a Venta', precioSlug: 'asesoramiento-arras-venta' },
  { slug: 'arras-vs-reserva-compra', nombre: 'Arras vs Reserva Compra', precioInfo: 'Info' },
  { slug: 'guia-arras-penitenciales', nombre: 'Guía Arras Penitenciales', precioInfo: 'Info' },
  { slug: 'revision-contrato-arras', nombre: 'Revisión Contrato Arras', precioSlug: 'revision-correccion-arras' },
  { slug: 'contrato-compraventa', nombre: 'Contrato Compraventa', precioSlug: 'contrato-compraventa' },
  { slug: 'cuanto-cuesta-contrato-alquiler', nombre: 'Cuánto Cuesta Contrato Alquiler', precioInfo: 'Info' },
  { slug: 'revision-contrato-alquiler', nombre: 'Revisión Contrato Alquiler', precioSlug: 'revision-alquiler' },
  { slug: 'contrato-ilegal', nombre: 'Análisis Contrato Ilegal', precioSlug: 'contrato-ilegal' },
  { slug: 'contrato-alquiler-habitacion', nombre: 'Contrato Alquiler Habitación', precioSlug: 'alquiler-habitaciones' },
  { slug: 'prestamo-particulares', nombre: 'Préstamo entre Particulares', precioSlug: 'prestamo-particulares' },
  { slug: 'compra-parking-trastero', nombre: 'Compra Parking o Trastero', precioSlug: 'compra-completa-parking-trastero' },
  { slug: 'contrato-arras', nombre: 'Contrato Arras (Info)', precioSlug: 'arras-penitenciales' },
  { slug: 'venta-completa-reserva-escritura', nombre: 'Venta Completa Genérica', precioSlug: 'venta-completa-reserva-escritura' },
]

export const LANDINGS_POR_CIUDAD: LandingPorCiudad[] = [
  {
    id: 'contrato-arras',
    nombre: 'Contrato de Arras Penitenciales',
    precioSlug: 'arras-penitenciales',
    href: (c) => `/${c}/contrato-arras`,
    ciudades: Object.keys(CONTRATO_ARRAS_PREMIUM).sort(),
  },
  {
    id: 'contrato-alquiler',
    nombre: 'Contrato de Alquiler LAU',
    precioLauRango: true,
    href: (c) => `/${c}/contrato-alquiler`,
    ciudades: [...new Set([...Object.keys(CONTRATO_ALQUILER_PREMIUM), 'granada'])].sort(),
  },
  {
    id: 'contratos-inmobiliarios',
    nombre: 'Contratos Inmobiliarios',
    precioInfo: formatPrecioDesde('arras-penitenciales'),
    href: (c) => `/contratos-inmobiliarios/${c}`,
    ciudades: [...CONTRATOS_INMOBILIARIOS_CIUDAD_SLUGS].sort(),
  },
  {
    id: 'gestoria-hub',
    nombre: 'Gestoría Ciudad (Hub)',
    precioInfo: formatPrecioDesde('contrato-alquiler-barcelona'),
    href: (c) => `/gestoria/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'bilbao', 'palma', 'zaragoza', 'alicante'],
  },
  {
    id: 'venta-completa',
    nombre: 'Venta Completa hasta Escritura',
    precioSlug: 'venta-completa-reserva-escritura',
    href: (c) => `/gestoria/venta-completa-reserva-escritura/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'salamanca', 'valladolid'],
  },
  {
    id: 'asesoria-compra',
    nombre: 'Asesoría Compra de Piso',
    precioSlug: 'compra-completa-reserva-escritura',
    href: (c) => `/gestoria/asesoria-compra-piso/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'alicante', 'zaragoza', 'valladolid', 'mallorca', 'bilbao', 'coruna', 'murcia', 'pamplona'],
  },
  {
    id: 'due-diligence',
    nombre: 'Due Diligence Pre-Compra',
    precioSlug: 'pack-due-diligence-precompra',
    href: (c) => `/gestoria/due-diligence-precompra/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'bilbao', 'zaragoza', 'coruna'],
  },
  {
    id: 'pack-arras-documental',
    nombre: 'Pack Arras Plus Comprador',
    precioSlug: 'pack-arras-revision-documental',
    href: (c) => `/gestoria/pack-arras-revision-documental/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'zaragoza', 'bilbao', 'coruna', 'valladolid', 'murcia', 'pamplona'],
  },
  {
    id: 'contrato-alquiler-habitacion',
    nombre: 'Contrato Alquiler Habitación',
    precioSlug: 'alquiler-habitaciones',
    href: (c) => `/gestoria/contrato-alquiler-habitacion/${c}`,
    ciudades: ['madrid', 'barcelona', 'sevilla', 'malaga', 'bilbao', 'valencia', 'zaragoza', 'asturias'],
  },
  {
    id: 'alquiler-local-comercial',
    nombre: 'Alquiler Local Comercial',
    precioSlug: 'alquiler-local-comercial',
    href: (c) => `/gestoria/alquiler-local-comercial/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'bilbao', 'zaragoza', 'alicante'],
  },
  {
    id: 'prestamo-particulares',
    nombre: 'Préstamo entre Particulares',
    precioSlug: 'prestamo-particulares',
    href: (c) => `/gestoria/prestamo-particulares/${c}`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'bilbao', 'zaragoza', 'mallorca', 'valladolid'],
  },
  {
    id: 'alquiler-particulares',
    nombre: 'Alquiler de Particulares',
    precioInfo: 'Portal',
    href: (c) => `/${c}/alquiler-particulares`,
    ciudades: [...CIUDADES_PORTAL_SLUGS],
  },
  {
    id: 'alquiler-sin-agencia',
    nombre: 'Alquiler sin Agencia',
    precioInfo: 'Portal',
    href: (c) => `/${c}/alquiler-sin-agencia`,
    ciudades: CIUDADES_PORTAL,
  },
  {
    id: 'vender-piso',
    nombre: 'Vender Piso en Ciudad',
    precioInfo: 'Portal',
    href: (c) => `/${c}/vender-piso`,
    ciudades: CIUDADES_PORTAL,
  },
  {
    id: 'pisos-ciudad',
    nombre: 'Pisos en Ciudad',
    precioInfo: 'Portal',
    href: (c) => `/${c}/pisos`,
    ciudades: CIUDADES_PORTAL,
  },
  {
    id: 'pisos-sin-comision',
    nombre: 'Pisos Particulares sin Comisión',
    precioInfo: 'Portal',
    href: (c) => `/${c}/pisos-particulares-sin-comision`,
    ciudades: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga'],
  },
]

export function contarLandingsPorCiudad(): number {
  return LANDINGS_POR_CIUDAD.reduce((sum, s) => sum + s.ciudades.length, 0)
}

export const SERVICIOS_GUIA = [
  {
    titulo: 'Gestoría Inmobiliaria',
    descripcion: 'Asesoría completa para comprar, vender o alquilar tu propiedad',
    slug: 'gestoria',
    imagen: '/gestoria2.jpg',
    categoria: 'Gestoría',
  },
  {
    titulo: 'Contrato de Arras',
    descripcion: 'Redacción profesional de contratos de señal y arras penitenciales',
    slug: 'contrato-arras',
    imagen: '/gestoria1.jpg',
    categoria: 'Compraventa',
  },
  {
    titulo: 'Contrato de Alquiler',
    descripcion: 'Contratos LAU con todas las cláusulas legales actualizadas',
    slug: 'contrato-alquiler',
    imagen: '/gestoria4.jpg',
    categoria: 'Alquiler',
  },
  {
    titulo: 'Contratos Inmobiliarios',
    descripcion:
      'Arras, alquiler LAU con inventario y fianza, acompañamiento de compra y packs vendedor por ciudad',
    slug: 'contratos-inmobiliarios',
    imagen: '/gestoria1.jpg',
    categoria: 'Compraventa',
  },
  {
    titulo: 'Contrato Alquiler Habitación',
    descripcion: `Piso compartido y coliving con asesor experto. ${precioLabel('alquiler-habitaciones')} IVA incluido`,
    slug: 'contrato-alquiler-habitacion',
    imagen: '/gestoria6.jpg',
    categoria: 'Alquiler',
  },
  {
    titulo: 'Préstamo entre Particulares',
    descripcion: `Formaliza préstamos privados con nota fiscal. ${precioLabel('prestamo-particulares')} IVA incluido`,
    slug: 'prestamo-particulares',
    imagen: '/gestoria3.jpg',
    categoria: 'Financiación',
  },
  {
    titulo: 'Acompañamiento de Venta',
    descripcion: 'Te ayudamos en todo el proceso de venta de tu propiedad',
    slug: 'asesoramiento-arras-venta',
    imagen: '/gestoria10.jpg',
    categoria: 'Premium',
  },
  {
    titulo: 'Alquiler Local Comercial',
    descripcion: 'Contrato LAU para locales y naves. Madrid, Barcelona, Valencia, Sevilla, Málaga y más',
    slug: 'alquiler-local-comercial',
    imagen: '/gestoria6.jpg',
    categoria: 'Alquiler',
  },
  {
    titulo: 'Revisión Contrato Alquiler',
    descripcion: 'Revisión legal de contratos de alquiler existentes',
    slug: 'revision-contrato-alquiler',
    imagen: '/gestoria7.jpg',
    categoria: 'Revisión',
  },
  {
    titulo: 'Contrato de Compraventa',
    descripcion: 'Contratos privados de compraventa inmobiliaria',
    slug: 'contrato-compraventa',
    imagen: '/gestoria3.jpg',
    categoria: 'Compraventa',
  },
  {
    titulo: 'Venta Completa + Escritura',
    descripcion: 'Servicio integral desde reserva hasta firma en notaría',
    slug: 'venta-completa-reserva-escritura',
    imagen: '/gestoria11.jpg',
    categoria: 'Premium',
  },
  {
    titulo: 'Asesoría Compra de Piso',
    descripcion: 'Asesoramiento experto antes de comprar tu vivienda',
    slug: 'asesoria-compra-piso',
    imagen: '/gestoria3.jpg',
    categoria: 'Premium',
  },
] as const

export const CIUDADES_SEO = [
  { slug: 'madrid', nombre: 'Madrid', texto: 'Alquiler habitación, arras, LAU y due diligence' },
  { slug: 'barcelona', nombre: 'Barcelona', texto: 'Alquiler habitación, LAU, arras y due diligence' },
  { slug: 'valencia', nombre: 'Valencia', texto: 'Contratos de alquiler, arras, asesoría compra' },
  { slug: 'sevilla', nombre: 'Sevilla', texto: 'Venta sin agencia, contratos LAU, due diligence' },
  { slug: 'malaga', nombre: 'Málaga', texto: 'Due diligence compra, venta completa, costa y centro' },
  { slug: 'bilbao', nombre: 'Bilbao', texto: 'Due diligence compra, arras y normativa foral vasca' },
  { slug: 'palma', nombre: 'Palma', texto: 'Normativa balear, IBAVI, zonas tensionadas' },
  { slug: 'zaragoza', nombre: 'Zaragoza', texto: 'Contratos de alquiler y arras, mercado en crecimiento' },
  { slug: 'alicante', nombre: 'Alicante', texto: 'Costa blanca, compradores extranjeros, cédula habitabilidad' },
  { slug: 'salamanca', nombre: 'Salamanca', texto: 'Venta universitaria, casco histórico, Castilla y León' },
  { slug: 'valladolid', nombre: 'Valladolid', texto: 'Venta particular, compradores desde Madrid, provincia' },
] as const
