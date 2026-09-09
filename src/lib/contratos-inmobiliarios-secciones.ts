import { getPrecioServicio } from '@/lib/gestoria-catalogo'

export type ContratoServicioProfundo = {
  id: string
  kicker: string
  titulo: string
  intro: string
  /** Pasos concretos de cómo redactamos / gestionamos este servicio */
  pasosRedaccion: string[]
  beneficios: string[]
  extra: string
  imagen: string
  imagenAlt: string
  precio: number
  precioNota?: string
  ctaHref: string
  ctaLabel: string
  ctaSecundarioHref?: string
  ctaSecundarioLabel?: string
  invertido?: boolean
}

export const CONTRATOS_SERVICIOS_PROFUNDOS: ContratoServicioProfundo[] = [
  {
    id: 'arras',
    kicker: 'Contrato de arras',
    titulo: 'Cómo redactamos vuestro contrato de arras',
    intro:
      'En Inmonest no rellenamos plantillas: un gestor inmobiliario recoge los datos reales de comprador, vendedor e inmueble, revisa la nota simple registral y redacta unas arras penitenciales o confirmatorias adaptadas a vuestra CCAA, con plazos, importes y penalizaciones si alguien incumple.',
    pasosRedaccion: [
      'Recogemos datos de las partes, precio, señal entregada y fecha límite para escritura.',
      'Revisamos nota simple, cargas registrales y coherencia con la operación acordada.',
      'Redactamos cláusulas de arras penitenciales o confirmatorias, condición suspensiva de hipoteca si aplica, y gastos.',
      'Entregamos PDF firmable en 48 h con revisiones incluidas en los 7 días siguientes.',
    ],
    beneficios: [
      'Arras penitenciales o confirmatorias con datos reales de las partes',
      'Revisión de nota simple registral antes de firmar la señal',
      'Cláusulas de desistimiento, penalización e incumplimiento bien definidas',
      'Protección frente a plantillas genéricas que generan conflictos costosos',
      'PDF firmable en 48 h · revisiones incluidas',
      'Gestor asignado con teléfono directo y panel de seguimiento',
    ],
    extra:
      'Comprar o vender entre particulares sin agencia no significa renunciar a seguridad. Un contrato de arras bien redactado protege a comprador y vendedor antes de la escritura.',
    imagen: '/gestoria1.jpg',
    imagenAlt: 'Gestor inmobiliario redactando contrato de arras penitenciales',
    precio: getPrecioServicio('arras-penitenciales') ?? 145,
    precioNota: 'Arras penitenciales · IVA incluido',
    ctaHref: '/gestoria/solicitar/arras-penitenciales',
    ctaLabel: 'Contratar contrato de arras',
    ctaSecundarioHref: '/gestoria/solicitar/pack-arras-revision-documental',
    ctaSecundarioLabel: 'Pack arras + revisión documental',
  },
  {
    id: 'alquiler',
    kicker: 'Contrato de alquiler LAU',
    titulo: 'Cómo redactamos tu contrato de alquiler con inventario y fianza',
    intro:
      'Redactamos el contrato de arrendamiento de vivienda habitual conforme a la LAU y la Ley de Vivienda 2026. Incluimos el inventario profesional como anexo — mobiliario, estado del inmueble y entrega de llaves — y regulamos la fianza legal, garantías adicionales y depósito autonómico cuando corresponda.',
    pasosRedaccion: [
      'Definimos renta, duración, fianza legal y garantías adicionales conforme a la LAU.',
      'Redactamos cláusulas sobre mascotas, subarriendo, obras, IPC y resolución anticipada.',
      'Elaboramos inventario detallado: mobiliario, electrodomésticos, estado de paredes y suelos.',
      'Regulamos depósito de fianza ante el organismo autonómico y entrega de llaves por escrito.',
      'Entregamos contrato + inventario en PDF en 48 h, listos para firmar.',
    ],
    beneficios: [
      'Contrato LAU actualizado a normativa 2026',
      'Inventario profesional incluido como anexo del contrato',
      'Fianza, garantías adicionales y depósito autonómico correctamente regulados',
      'Cláusulas sobre mascotas, subarriendo, obras y resolución sin sorpresas',
      'Estado del inmueble y entrega de llaves documentados por escrito',
      'Expediente trazable en panel con tu gestor asignado',
    ],
    extra:
      'Un alquiler mal formalizado puede acabar en impago, fianza retenida o litigio por cláusulas nulas. Nosotros redactamos pensando en tu tranquilidad a largo plazo, no en rellenar un PDF genérico.',
    imagen: '/gestoria7.jpg',
    imagenAlt: 'Contrato de alquiler LAU con inventario redactado por Inmonest',
    precio: getPrecioServicio('contrato-alquiler') ?? 145,
    precioNota: 'Alquiler LAU + inventario · IVA incluido',
    ctaHref: '/gestoria/solicitar/contrato-alquiler',
    ctaLabel: 'Contratar contrato de alquiler',
    ctaSecundarioHref: '/gestoria/contrato-alquiler',
    ctaSecundarioLabel: 'Más sobre alquiler LAU',
    invertido: true,
  },
  {
    id: 'acompanamiento-compra',
    kicker: 'Acompañamiento de compra',
    titulo: 'Cómo te acompañamos en la compra de tu piso',
    intro:
      'Servicio integral para compradores entre particulares: desde la reserva y las arras hasta la escritura en notaría. Un gestor experto revisa contratos, nota simple, cargas, actas de comunidad y documentación técnica. Tarifa plana sin comisión sobre el precio del piso.',
    pasosRedaccion: [
      'Primera llamada en menos de 24 h: analizamos precio, plazos, vendedor y documentación disponible.',
      'Revisamos reserva, arras, nota simple, cargas, derramas e ITE o certificado energético.',
      'Redactamos o corregimos arras y contratos intermedios pensando en tu interés como comprador.',
      'Coordinamos checklist documental y te acompañamos hasta el día de la firma en notaría.',
    ],
    beneficios: [
      'Tarifa plana 687 € — sin porcentaje sobre el precio del inmueble',
      'Gestor asignado en menos de 24 h con WhatsApp y teléfono directo',
      'Revisión de reserva, arras, nota simple, cargas y documentación de comunidad',
      'Trabajamos para ti como comprador, no para el vendedor ni la agencia',
      'Coordinación con notaría y checklist hasta el día de la firma',
      'Evitas errores de miles de euros: derramas ocultas, ITE pendiente o arras abusivas',
    ],
    extra:
      'Comprar piso sin agencia ahorra comisiones, pero no elimina el riesgo jurídico. Nuestro servicio cubre desde la reserva hasta las llaves con un profesional que conoce tu expediente de principio a fin.',
    imagen: '/gestoria11.jpg',
    imagenAlt: 'Asesor Inmonest acompañando compra de vivienda entre particulares',
    precio: getPrecioServicio('compra-completa-reserva-escritura') ?? 687,
    precioNota: 'Reserva a escritura · IVA incluido · sin comisión',
    ctaHref: '/gestoria/solicitar/compra-completa-reserva-escritura',
    ctaLabel: 'Contratar acompañamiento de compra',
    ctaSecundarioHref: '/gestoria/asesoria-compra-piso',
    ctaSecundarioLabel: 'Ver servicio en detalle',
  },
  {
    id: 'acompanamiento-venta',
    kicker: 'Acompañamiento de venta',
    titulo: 'Cómo te acompañamos en la venta de tu vivienda',
    intro:
      'Servicio completo para vendedores entre particulares: redactamos las arras a tu favor, recopilamos y analizamos toda la documentación del inmueble y te preparamos para escriturar ante notaría sin sorpresas. Sin comisión del 3-5 % de una agencia.',
    pasosRedaccion: [
      'Analizamos tu operación: precio acordado, plazos del comprador y documentación que ya tienes.',
      'Redactamos arras penitenciales protegiendo tu señal como vendedor (PDF en 48 h).',
      'Recopilamos escrituras, nota simple, certificado energético y actas de comunidad (2 años).',
      'Revisamos ITE, cargas, derramas pendientes y deudas de IBI o suministros.',
      'Entregamos informe con riesgos, tareas pendientes y checklist para notaría.',
    ],
    beneficios: [
      'Tarifa plana 687 € — sin comisión sobre el precio de venta',
      'Arras redactadas a favor del vendedor con cláusulas de protección de señal',
      'Recopilación y análisis de documentación de comunidad, ITE e IEE',
      'Checklist documental para que notaría no bloquee la escritura',
      'Gestor asignado con panel de seguimiento y teléfono directo',
      'Informe de riesgos y recomendaciones en 3-5 días laborables',
    ],
    extra:
      'Vender sin agencia ahorra miles en comisión, pero eres tú quien debe garantizar que el piso está listo para escriturar. Un comprador exigente puede paralizar la operación si falta documentación o las arras no te protegen.',
    imagen: '/gestoria10.jpg',
    imagenAlt: 'Acompañamiento de venta de vivienda entre particulares con Inmonest',
    precio: getPrecioServicio('venta-completa-reserva-escritura') ?? 687,
    precioNota: 'Reserva a escritura · IVA incluido · sin comisión',
    ctaHref: '/gestoria/solicitar/venta-completa-reserva-escritura',
    ctaLabel: 'Contratar acompañamiento de venta',
    ctaSecundarioHref: '/gestoria/venta-completa-reserva-escritura',
    ctaSecundarioLabel: 'Ver servicio en detalle',
    invertido: true,
  },
  {
    id: 'pack-arras-vendedor',
    kicker: 'Pack Arras Plus · Vendedores',
    titulo: 'Arras + documentación para vender sin agencia',
    intro:
      'Si ya tienes comprador y solo necesitas arras bien redactadas más ayuda documental, el Pack Arras Plus Vendedor combina contrato de arras penitenciales a tu favor con recopilación y análisis de la documentación del inmueble — a un precio inferior al servicio de venta completa.',
    pasosRedaccion: [
      'Recogemos datos de la operación y redactamos arras penitenciales a favor del vendedor.',
      'Te guiamos para obtener escrituras, nota simple y certificado energético.',
      'Analizamos actas de comunidad, derramas, ITE y cargas registrales.',
      'Entregamos arras en PDF + informe documental con tareas pendientes antes de notaría.',
    ],
    beneficios: [
      'Redacción de arras penitenciales a favor del vendedor (PDF en 48 h)',
      'Ayuda para recabar escrituras, nota simple y certificado energético',
      'Análisis de actas de comunidad (2 años) y derramas pendientes',
      'Revisión del ITE, cargas registrales y deudas de IBI o suministros',
      'Checklist documental para escriturar ante notario sin retrasos',
      'Informe con riesgos y recomendaciones en 3-5 días',
    ],
    extra:
      'Opción más económica que la venta completa si ya dominas la negociación pero quieres arras profesionales y documentación en orden antes de ir a notaría.',
    imagen: '/contratodearras.jpg',
    imagenAlt: 'Pack Arras Plus Vendedor — arras y documentación para vender sin agencia',
    precio: getPrecioServicio('pack-arras-plus-vendedor') ?? 450,
    precioNota: 'Arras + documentación · IVA incluido',
    ctaHref: '/gestoria/solicitar/pack-arras-plus-vendedor',
    ctaLabel: 'Contratar Pack Arras Plus Vendedor',
    ctaSecundarioHref: '/gestoria/pack-arras-plus-vendedor',
    ctaSecundarioLabel: 'Ver más información',
  },
]
