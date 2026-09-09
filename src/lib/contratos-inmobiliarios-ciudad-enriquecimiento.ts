import type { ContratosInmobiliariosCiudadSlug } from './contratos-inmobiliarios-ciudades'

export type ContratosServicioRapidoLocal = {
  arras: string
  alquiler: string
  packVendedor: string
  compra: string
}

export type ContratosCiudadEnriquecimiento = {
  /** H1 único — evita patrón "Contratos inmobiliarios en {ciudad}" en las 12 URLs */
  heroTitulo: string
  heroHighlight: string
  mercadoKicker: string
  normativaKicker: string
  barriosKicker: string
  serviciosRapidos: ContratosServicioRapidoLocal
  /** Precio venta ejemplo para tabla comparativa agencia 5 % vs Inmonest */
  precioEjemploVenta: number
  /** Honorario orientativo agencia por gestión de alquiler (default 3.000 €) */
  precioAgenciaAlquiler?: number
}

export const CONTRATOS_CIUDAD_ENRIQUECIMIENTO: Record<
  ContratosInmobiliariosCiudadSlug,
  ContratosCiudadEnriquecimiento
> = {
  madrid: {
    heroTitulo: 'Arras, alquiler LAU y contratos de compraventa en',
    heroHighlight: 'Madrid capital',
    mercadoKicker: 'Mercado madrileño',
    normativaKicker: 'LAU y fianzas en Madrid',
    barriosKicker: 'Operativa por barrio',
    precioEjemploVenta: 320_000,
    precioAgenciaAlquiler: 3_200,
    serviciosRapidos: {
      arras: 'Señal penitencial con condición suspensiva de hipoteca — habitual en operaciones de Chamberí y Salamanca donde el comprador compite con varias ofertas.',
      alquiler: 'Arrendamiento LAU con depósito ante la Comunidad de Madrid, inventario en pisos amueblados de Malasaña y cláusulas válidas en zona no tensionada o tensionada.',
      packVendedor: 'Documentación de comunidad, IEE e ITE para vender en Getafe, Pozuelo o centro sin que notaría bloquee la escritura por cargas ocultas.',
      compra: 'Desde reserva en Vallecas hasta escritura en Las Rozas: gestor fijo 687 € sin comisión sobre el ticket madrileño.',
    },
  },
  barcelona: {
    heroTitulo: 'Contratos de arras y alquiler adaptados a la normativa de',
    heroHighlight: 'Barcelona',
    mercadoKicker: 'Mercado catalán',
    normativaKicker: 'Generalitat e INCASÒL',
    barriosKicker: 'Barrios y municipios',
    precioEjemploVenta: 350_000,
    precioAgenciaAlquiler: 3_300,
    serviciosRapidos: {
      arras: 'Arras con mención de ITE obligatoria en edificios del Eixample y verificación de cargas antes de entregar señal en operaciones rápidas.',
      alquiler: 'Contrato LAU con límites de renta en zona tensionada, fianza en INCASÒL y distinción clara entre vivienda habitual y uso turístico en Poblenou o Gràcia.',
      packVendedor: 'Recopilación de cédula de la Generalitat, certificado energético y deudas de comunidad para vender en L\'Hospitalet o Badalona entre particulares.',
      compra: 'Revisión de reserva y arras en operaciones con presión de mercado en Sant Martí o Sarrià — tarifa plana sin el 3-5 % de agencia barcelonesa.',
    },
  },
  valencia: {
    heroTitulo: 'Redacción de arras y alquiler LAU en',
    heroHighlight: 'Valencia y l\'Horta',
    mercadoKicker: 'Comunitat Valenciana',
    normativaKicker: 'Documentación valenciana',
    barriosKicker: 'Ruzafa, centro y metropolitanos',
    precioEjemploVenta: 260_000,
    precioAgenciaAlquiler: 2_800,
    serviciosRapidos: {
      arras: 'Contrato de señal en compraventa de bajos en Ruzafa o Benimaclet con plazos realistas para hipoteca y revisión de nota simple del Registro de Valencia.',
      alquiler: 'Alquiler de vivienda habitual con cédula de habitabilidad autonómica, depósito legal y cláusulas sobre terrazas en hostelería mal clasificada.',
      packVendedor: 'Pack documental para vendedores en Mislata o Paterna: certificado de deudas de comunidad y eficiencia energética exigidos en la Comunitat.',
      compra: 'Acompañamiento de compra en operaciones entre particulares en Ciutat Vella o Campanar — 687 € frente a comisiones de miles en un mercado en alza.',
    },
  },
  sevilla: {
    heroTitulo: 'Contratos de compraventa y arrendamiento en',
    heroHighlight: 'Sevilla capital',
    mercadoKicker: 'Andalucía occidental',
    normativaKicker: 'LAU andaluza',
    barriosKicker: 'Triana, Nervión y área metropolitana',
    precioEjemploVenta: 220_000,
    precioAgenciaAlquiler: 2_500,
    serviciosRapidos: {
      arras: 'Arras penitenciales en operaciones de Triana o Los Remedios con cláusulas sobre plusvalía municipal y plazo hasta escritura en notaría sevillana.',
      alquiler: 'Contrato LAU con fianza, IBI y comunidad repartidos conforme a ley — frecuente en alquileres familiares en Macarena o Bellavista.',
      packVendedor: 'Preparación documental para vender en Dos Hermanas o centro histórico: IEE en edificios antiguos y certificado de deudas de comunidad.',
      compra: 'Gestor desde reserva hasta llaves en compras de particular en Nervión — sin pagar comisión sobre el precio del piso sevillano.',
    },
  },
  malaga: {
    heroTitulo: 'Arras y alquiler entre particulares en',
    heroHighlight: 'Málaga y Costa del Sol',
    mercadoKicker: 'Mercado malagueño',
    normativaKicker: 'VFT y normativa Junta',
    barriosKicker: 'Centro, Soho y litoral',
    precioEjemploVenta: 300_000,
    precioAgenciaAlquiler: 2_900,
    serviciosRapidos: {
      arras: 'Señal de compraventa en operaciones con compradores internacionales en El Limonar o La Malagueta — cláusulas en español comprensible y plazos de financiación.',
      alquiler: 'Alquiler LAU distinto de régimen turístico VFT: imprescindible en centro histórico y Soho donde la Junta exige registro de viviendas vacacionales.',
      packVendedor: 'Documentación para vender en Torremolinos o capital: IEE en edificios de +50 años y liquidación orientativa de plusvalía municipal.',
      compra: 'Due diligence y arras en compras en Teatinos o El Palo — protección frente a derramas de rehabilitación de fachada en edificios costeros.',
    },
  },
  bilbao: {
    heroTitulo: 'Contratos inmobiliarios para particulares en',
    heroHighlight: 'Bilbao y Bizkaia',
    mercadoKicker: 'País Vasco',
    normativaKicker: 'LAU y Hacienda Foral',
    barriosKicker: 'Casco Viejo e Indautxu',
    precioEjemploVenta: 280_000,
    precioAgenciaAlquiler: 3_000,
    serviciosRapidos: {
      arras: 'Arras en operaciones de Indautxu o Abando con revisión registral y condiciones suspensivas habituales en compradores con hipoteca vasca.',
      alquiler: 'Alquiler LAU con depósito y cláusulas de actualización válidas — demanda estable en Deusto y Santutxu entre particulares sin agencia.',
      packVendedor: 'Pack vendedor en edificios protegidos del Casco Viejo: compatibilidad urbanística y documentación técnica antes de ir a notaría.',
      compra: 'Revisión de reserva en Gran Bilbao — gestoría fija para quien compra de particular en un mercado con rentas contenidas vs Madrid.',
    },
  },
  zaragoza: {
    heroTitulo: 'Arras y alquiler LAU en',
    heroHighlight: 'Zaragoza capital',
    mercadoKicker: 'Aragón',
    normativaKicker: 'Trámites en Zaragoza',
    barriosKicker: 'Centro, Delicias y Valdespartera',
    precioEjemploVenta: 180_000,
    precioAgenciaAlquiler: 2_200,
    serviciosRapidos: {
      arras: 'Contrato de señal en compraventa accesible del centro o Actur — plazos realistas y cláusulas de arras penitenciales redactadas para mercado aragonés.',
      alquiler: 'Alquiler de vivienda habitual en Valdespartera o Las Fuentes con fianza legal y sin cláusulas abusivas de gastos de comunidad.',
      packVendedor: 'Documentación para vender en Utebo o Cuarte: nota simple, certificado energético y deudas de comunidad en operaciones entre familias.',
      compra: 'Acompañamiento 687 € en compras de particular — alternativa a comisión de agencia en un mercado con precios más moderados que Barcelona.',
    },
  },
  alicante: {
    heroTitulo: 'Contratos de arras y alquiler en',
    heroHighlight: 'Alicante y Costa Blanca',
    mercadoKicker: 'Costa Blanca',
    normativaKicker: 'Generalitat y turismo',
    barriosKicker: 'Explanada, centro y Elche',
    precioEjemploVenta: 240_000,
    precioAgenciaAlquiler: 2_700,
    serviciosRapidos: {
      arras: 'Señal en compraventa de pisos en Playa de San Juan o centro con distinción entre uso residencial y vivienda turística mal inscrita en Registro de Turisme.',
      alquiler: 'Alquiler LAU con depósito autonómico — no confundir con contrato turístico de temporada en barrios con alta presión hostelera.',
      packVendedor: 'Pack documental para vender en Elche o San Vicente: derramas de rehabilitación de fachada y certificado de eficiencia exigido en Comunitat.',
      compra: 'Revisión de arras en operaciones con compradores británicos o nórdicos — cláusulas claras y verificación documental antes de señal en Costa Blanca.',
    },
  },
  palma: {
    heroTitulo: 'Contratos de compraventa y alquiler en',
    heroHighlight: 'Palma de Mallorca',
    mercadoKicker: 'Islas Baleares',
    normativaKicker: 'Normativa balear',
    barriosKicker: 'Palma, Playa y interior',
    precioEjemploVenta: 310_000,
    precioAgenciaAlquiler: 3_100,
    serviciosRapidos: {
      arras: 'Arras en operaciones con restricciones de compra a no residentes y revisión de licencias turísticas en edificios del centro de Palma.',
      alquiler: 'Alquiler LAU con depósito en IBAVI cuando corresponde — cláusulas adaptadas a Ley de vivienda y mercado tensionado insular.',
      packVendedor: 'Documentación para vender en Calvià o Palma: cédula, certificado energético y situación de vivienda de uso turístico en el anuncio.',
      compra: 'Gestor en compras de particular en mercado con escasez de stock — verificación de cargas y derramas en comunidades de edificios costeros.',
    },
  },
  murcia: {
    heroTitulo: 'Arras y alquiler entre particulares en',
    heroHighlight: 'Murcia capital',
    mercadoKicker: 'Región de Murcia',
    normativaKicker: 'Trámites murcianos',
    barriosKicker: 'Centro, El Carmen y pedanías',
    precioEjemploVenta: 175_000,
    precioAgenciaAlquiler: 2_400,
    serviciosRapidos: {
      arras: 'Contrato de señal en operaciones de centro o pedanías con plazos para hipoteca y revisión de nota simple del Registro de Murcia.',
      alquiler: 'Alquiler LAU con fianza y depósito conforme a normativa — demanda estable en barrios universitarios y familiares.',
      packVendedor: 'Pack Arras Plus Vendedor (450 €): arras redactadas a tu favor y recopilación de documentación de comunidad, ITE y nota simple antes de escriturar.',
      compra: 'Asesoría de compra en operaciones rápidas en mercado regional — tarifa fija sin comisión sobre precio del inmueble murciano.',
    },
  },
  coruna: {
    heroTitulo: 'Contratos inmobiliarios en',
    heroHighlight: 'A Coruña y Galicia',
    mercadoKicker: 'Mercado gallego',
    normativaKicker: 'Xunta y municipios',
    barriosKicker: 'Coruña, Ferrol y área',
    precioEjemploVenta: 200_000,
    precioAgenciaAlquiler: 2_600,
    serviciosRapidos: {
      arras: 'Arras en operaciones del Ensanche coruñés o Orzán con revisión registral y cláusulas sobre humedades frecuentes en edificios de piedra.',
      alquiler: 'Alquiler LAU con depósito autonómico gallego — cláusulas de fianza y devolución explícitas en mercado de rentas moderadas.',
      packVendedor: 'Documentación para vender en Ferrol o Coruña: certificado energético, ITE en edificios antiguos del casco histórico.',
      compra: 'Acompañamiento de compra desde reserva en operaciones entre particulares en barrios como Matadero o Cuatro Caminos.',
    },
  },
  pamplona: {
    heroTitulo: 'Arras y alquiler LAU en',
    heroHighlight: 'Pamplona y Navarra',
    mercadoKicker: 'Navarra',
    normativaKicker: 'Foral y municipal',
    barriosKicker: 'Ensanche, Rochapea y área',
    precioEjemploVenta: 230_000,
    precioAgenciaAlquiler: 2_800,
    serviciosRapidos: {
      arras: 'Señal penitencial en mercado estable de Pamplona — operaciones entre particulares con plazos para financiación y revisión de cargas registrales.',
      alquiler: 'Alquiler de vivienda habitual en Ensanche o Iturrama con cláusulas válidas y depósito conforme a LAU y normativa navarra aplicable.',
      packVendedor: 'Recopilación documental para vender en área metropolitana: nota simple, certificado de deudas y eficiencia energética.',
      compra: 'Gestor asignado en compras de particular — alternativa a comisión de agencia en ciudad con alta demanda residencial y oferta limitada.',
    },
  },
}

export function getContratosCiudadEnriquecimiento(
  slug: ContratosInmobiliariosCiudadSlug,
): ContratosCiudadEnriquecimiento {
  return CONTRATOS_CIUDAD_ENRIQUECIMIENTO[slug]
}
