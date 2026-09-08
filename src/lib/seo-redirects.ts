import type { Redirect } from 'next/dist/lib/load-custom-routes'

/**
 * Redirects 301 para URLs antiguas reportadas en GSC o enlaces legacy.
 * Centralizado para mantener next.config.ts legible.
 */
export const SEO_REDIRECTS: Redirect[] = [
  // ═══ ALIASES DE SLUGS GESTORÍA ═══
  {
    source: '/gestoria/alquiler-vivienda-lau',
    destination: '/gestoria/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/contrato-alquiler-temporal',
    destination: '/gestoria/alquiler-temporada',
    permanent: true,
  },
  {
    source: '/gestoria/solicitar/alquiler-vivienda-lau',
    destination: '/gestoria/solicitar/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/solicitar/contrato-alquiler-temporal',
    destination: '/gestoria/solicitar/alquiler-temporada',
    permanent: true,
  },

  // ═══ RESCISIÓN — VARIANTES ANTIGUAS ═══
  {
    source: '/gestoria/rescision-contrato',
    destination: '/gestoria/solicitar/rescision-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/rescision-contrato-alquiler',
    destination: '/gestoria/solicitar/rescision-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/rescision-alquiler-contrato',
    destination: '/gestoria/solicitar/rescision-alquiler',
    permanent: true,
  },

  // ═══ SERVICIOS RENOMBRADOS ═══
  {
    source: '/gestoria/acompanamiento-venta',
    destination: '/gestoria/venta-completa-reserva-escritura',
    permanent: true,
  },
  {
    source: '/gestoria/acompanamiento-venta/:ciudad',
    destination: '/gestoria/venta-completa-reserva-escritura/:ciudad',
    permanent: true,
  },
  {
    source: '/gestoria/due-diligence',
    destination: '/gestoria/pack-due-diligence-precompra',
    permanent: true,
  },
  {
    source: '/gestoria/compra-parking-trastero',
    destination: '/gestoria/compra-completa-parking-trastero',
    permanent: true,
  },
  {
    source: '/gestoria/asesoria-compra',
    destination: '/gestoria/compra-completa-reserva-escritura',
    permanent: true,
  },
  {
    source: '/gestoria/solicitar/asesoria-compra',
    destination: '/gestoria/solicitar/compra-completa-reserva-escritura',
    permanent: true,
  },
  {
    source: '/gestoria/asesoria-compra-piso',
    destination: '/gestoria/compra-completa-reserva-escritura',
    permanent: true,
  },
  {
    source: '/gestoria/revision-arras',
    destination: '/gestoria/revision-correccion-arras',
    permanent: true,
  },
  {
    source: '/gestoria/solicitar/revision-arras',
    destination: '/gestoria/solicitar/revision-correccion-arras',
    permanent: true,
  },
  {
    source: '/gestoria/revision-contrato-arras',
    destination: '/gestoria/revision-correccion-arras',
    permanent: true,
  },
  {
    source: '/gestoria/revision-contrato-arras/:path*',
    destination: '/gestoria/revision-correccion-arras',
    permanent: true,
  },
  {
    source: '/gestoria/ayuda-propietarios',
    destination: '/gestoria/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/solicitar/ayuda-propietarios',
    destination: '/gestoria/solicitar/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/revision-contrato-alquiler',
    destination: '/gestoria/revision-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/revision-contrato-alquiler/:path*',
    destination: '/gestoria/revision-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/contrato-alquiler-habitacion',
    destination: '/gestoria/alquiler-habitaciones',
    permanent: true,
  },
  {
    source: '/gestoria/due-diligence-precompra',
    destination: '/gestoria/pack-due-diligence-precompra',
    permanent: true,
  },
  {
    source: '/gestoria/alquiler-habitacion',
    destination: '/gestoria/alquiler-habitaciones',
    permanent: true,
  },
  {
    source: '/gestoria/gestoria/:ciudad',
    destination: '/gestoria/:ciudad',
    permanent: true,
  },
  {
    source: '/gestoria/gestoria',
    destination: '/gestoria',
    permanent: true,
  },
  {
    source: '/gestoria/burofax-desistimiento-alquiler',
    destination: '/gestoria/solicitar/rescision-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/contrato-alquiler-barcelona',
    destination: '/barcelona/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/contrato-compraventa/:ciudad',
    destination: '/gestoria/contrato-compraventa',
    permanent: true,
  },

  // ═══ CIUDADES — ATAJOS RAÍZ ═══
  {
    source: '/mes',
    destination: '/',
    permanent: true,
  },
  {
    source: '/mallorca',
    destination: '/mallorca/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/coruna',
    destination: '/coruna/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/palma',
    destination: '/palma/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/mallorca',
    destination: '/mallorca/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/coruna',
    destination: '/coruna/contrato-alquiler',
    permanent: true,
  },

  // ═══ BLOG — POSTS MOVIDOS O RENOMBRADOS ═══
  {
    source: '/blog/gestoria-inmobiliaria',
    destination: '/blog/que-es-gestoria-inmobiliaria',
    permanent: true,
  },
  {
    source: '/blog/vender-sin-comisiones',
    destination: '/blog/vender-piso-sin-comisiones',
    permanent: true,
  },
  {
    source: '/blog/due-diligence',
    destination: '/blog/due-diligence-compra-vivienda',
    permanent: true,
  },

  // ═══ GESTORÍA POR CIUDAD — HUBS LEGACY ═══
  {
    source: '/gestoria/:ciudad/gestoria-online',
    destination: '/gestoria/:ciudad',
    permanent: true,
  },
  {
    source: '/gestoria/:ciudad/contratos-alquiler',
    destination: '/:ciudad/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/gestoria/:ciudad/contrato-arras',
    destination: '/:ciudad/contrato-arras',
    permanent: true,
  },

  // ═══ VENTA — CONSOLIDACIÓN URL ═══
  {
    source: '/servicios/vender-piso-sin-inmobiliaria',
    destination: '/vender-piso-sin-agencia',
    permanent: true,
  },

  // ═══ ALIASES NUEVAS CIUDADES NORTE ═══
  {
    source: '/donostia/contrato-alquiler',
    destination: '/san-sebastian/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/donostia/contrato-arras',
    destination: '/san-sebastian/contrato-arras',
    permanent: true,
  },
  {
    source: '/vitoria-gasteiz/contrato-alquiler',
    destination: '/vitoria/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/vitoria-gasteiz/contrato-arras',
    destination: '/vitoria/contrato-arras',
    permanent: true,
  },

  // ═══ ALQUILER PARTICULARES — CIUDADES SIN LANDING DEDICADA (GSC 404) ═══
  {
    source: '/castellon/alquiler-particulares',
    destination: '/castellon/contrato-alquiler',
    permanent: true,
  },
  {
    source: '/murcia/alquiler-particulares',
    destination: '/pisos?ciudad=murcia&solo_particulares=true',
    permanent: true,
  },

  // ═══ GESTORÍA B2B AGENCIAS — URL canónica bajo /gestoria/{ciudad}/agencias ═══
  {
    source: '/agencias/gestoria/madrid',
    destination: '/gestoria/madrid/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/barcelona',
    destination: '/gestoria/barcelona/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/valencia',
    destination: '/gestoria/valencia/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/sevilla',
    destination: '/gestoria/sevilla/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/malaga',
    destination: '/gestoria/malaga/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/bilbao',
    destination: '/gestoria/bilbao/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/zaragoza',
    destination: '/gestoria/zaragoza/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/alicante',
    destination: '/gestoria/alicante/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/palma',
    destination: '/gestoria/palma/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/granada',
    destination: '/gestoria/granada/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/murcia',
    destination: '/gestoria/murcia/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/valladolid',
    destination: '/gestoria/valladolid/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/coruna',
    destination: '/gestoria/coruna/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/pamplona',
    destination: '/gestoria/pamplona/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/salamanca',
    destination: '/gestoria/salamanca/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/santander',
    destination: '/gestoria/santander/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/san-sebastian',
    destination: '/gestoria/san-sebastian/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/vitoria',
    destination: '/gestoria/vitoria/agencias',
    permanent: true,
  },
  {
    source: '/agencias/gestoria/asturias',
    destination: '/gestoria/asturias/agencias',
    permanent: true,
  },
]
