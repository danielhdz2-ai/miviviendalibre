import type { DueDiligenceFaqItem } from './due-diligence-ciudad-faq'

export type AsesoriaCompraEnriquecimiento = {
  beneficiosTitulo: string
  beneficiosIntro: string
  tramitesTitulo: string
  tramitesIntro: string
  tramitesLocales: string[]
  pasosTitulo: string
  pasos: { titulo: string; desc: string }[]
}

export const ASESORIA_COMPRA_ENRIQUECIMIENTO: Record<string, AsesoriaCompraEnriquecimiento> = {
  madrid: {
    beneficiosTitulo: 'Comprar en Madrid de particular sin comisión de agencia',
    beneficiosIntro:
      'En Madrid capital el 40 % de operaciones van con plazos inferiores a una semana. Sin gestor, firmas arras con cláusulas desequilibradas o sin revisar IEE en edificios del centro.',
    tramitesTitulo: 'Trámites de compra en Madrid que revisamos',
    tramitesIntro: 'Checklist adaptado a Comunidad de Madrid e ITE/IEE en edificios antiguos:',
    tramitesLocales: [
      'Depósito de fianza legal ante organismo autonómico madrileño',
      'IEE e ITE en edificios de más de 50 años en Chamberí o Centro',
      'Verificación de plusvalía municipal e IBI al día antes de escritura',
    ],
    pasosTitulo: 'Cómo compramos contigo en Madrid',
    pasos: [
      { titulo: 'Llamada en 24 h', desc: 'Analizamos barrio (Salamanca, Vallecas, metropolitanos), precio y urgencia del vendedor.' },
      { titulo: '687 € tarifa plana', desc: 'Sin % sobre un piso de 320.000 € — ahorro de 9.600–16.000 € vs agencia.' },
      { titulo: 'Reserva y arras', desc: 'Revisión de condición suspensiva de hipoteca y nota simple del Registro de Madrid.' },
      { titulo: 'Escritura en notaría', desc: 'Coordinación documental hasta firma — incluso si compras desde otra provincia.' },
    ],
  },
  barcelona: {
    beneficiosTitulo: 'Asesoría compra piso Barcelona — Generalitat e ITE',
    beneficiosIntro:
      'En Barcelona la cédula de habitabilidad y la ITE bloquean operaciones cada semana. Comprar de particular en Idealista sin revisión legal es el error más caro.',
    tramitesTitulo: 'Documentación obligatoria en Cataluña',
    tramitesIntro: 'Revisamos lo que muchos vendedores particulares no entregan:',
    tramitesLocales: [
      'Cédula de habitabilidad de la Generalitat — obligatoria en notaría',
      'ITE en edificios con certificación pendiente en Eixample o Gràcia',
      'Estatutos de comunidad y derramas en zonas tensionadas de alquiler',
    ],
    pasosTitulo: 'Proceso de compra en Barcelona',
    pasos: [
      { titulo: 'Consulta inicial', desc: 'Valoramos si compras para habitación propia o inversión en zona tensionada.' },
      { titulo: 'Contratación 687 €', desc: 'Tarifa fija frente a 10.500–17.500 € de comisión en piso de 350.000 €.' },
      { titulo: 'Arras con ITE', desc: 'Detectamos inspecciones pendientes antes de entregar señal en Sants o Eixample.' },
      { titulo: 'Hasta escritura', desc: 'Coordinación con notaría barcelonesa y verificación final de cargas.' },
    ],
  },
  valencia: {
    beneficiosTitulo: 'Compra de piso en Valencia con gestor valenciano',
    beneficiosIntro:
      'Ruzafa, Benimaclet y el centro mueven operaciones rápidas entre particulares. La cédula valenciana y las derramas de rehabilitación son los puntos críticos.',
    tramitesTitulo: 'Trámites en Comunitat Valenciana',
    tramitesIntro: 'Documentación que exige la Generalitat Valenciana:',
    tramitesLocales: [
      'Cédula de habitabilidad autonómica vigente',
      'Certificado energético y IEE en edificios antiguos de Ciutat Vella',
      'Deudas de comunidad y derramas de fachada en edificios costeros',
    ],
    pasosTitulo: 'Tu compra en Valencia paso a paso',
    pasos: [
      { titulo: 'Primera llamada', desc: 'Analizamos barrio valenciano, precio de referencia y documentación del vendedor.' },
      { titulo: '687 € IVA incl.', desc: 'Sin comisión del 3-5 % sobre el precio del piso.' },
      { titulo: 'Revisión de arras', desc: 'Cláusulas sobre vivienda turística mal inscrita en Registro de Turisme.' },
      { titulo: 'Escritura', desc: 'Acompañamiento hasta notaría con gestor que conoce normativa valenciana.' },
    ],
  },
  sevilla: {
    beneficiosTitulo: 'Comprar piso de particular en Sevilla con seguridad',
    beneficiosIntro:
      'Triana, Nervión y Los Remedios concentran compraventa entre particulares. Plusvalía municipal e IBI deben revisarse antes de la señal.',
    tramitesTitulo: 'Trámites de compra en Sevilla',
    tramitesIntro: 'Adaptado al mercado andaluz y Ayuntamiento de Sevilla:',
    tramitesLocales: [
      'Plusvalía municipal (IIVTNU) — cálculo orientativo antes de firmar',
      'Certificado de deudas de comunidad en edificios históricos',
      'Cédula de habitabilidad y eficiencia energética andaluza',
    ],
    pasosTitulo: 'Proceso en Sevilla en 4 fases',
    pasos: [
      { titulo: 'Contacto 24 h', desc: 'Gestora Carmen analiza tu operación en capital o área metropolitana.' },
      { titulo: '687 € fijos', desc: 'Alternativa a comisión de agencia en mercado sevillano.' },
      { titulo: 'Arras y documentación', desc: 'Revisión registral y técnica en edificios del centro histórico.' },
      { titulo: 'Escritura', desc: 'Coordinación con notaría hasta entrega de llaves.' },
    ],
  },
  malaga: {
    beneficiosTitulo: 'Compra en Málaga y Costa del Sol sin agencia',
    beneficiosIntro:
      'Compradores internacionales y operaciones en máximos históricos exigen revisión de VFT, IEE y plusvalía antes de arras.',
    tramitesTitulo: 'Documentación en compraventa malagueña',
    tramitesIntro: 'Riesgos frecuentes en Costa del Sol:',
    tramitesLocales: [
      'Registro VFT si el piso tuvo uso turístico — Junta de Andalucía',
      'IEE obligatorio en edificios de +50 años para vender en Andalucía',
      'Derramas de rehabilitación en edificios del centro y litoral',
    ],
    pasosTitulo: 'Acompañamiento de compra en Málaga',
    pasos: [
      { titulo: 'Consulta inicial', desc: 'Evaluamos zona (centro, Teatinos, Costa del Sol) y perfil del vendedor.' },
      { titulo: '687 € plano', desc: 'Sin comisión sobre ticket de 300.000 € o más.' },
      { titulo: 'Due diligence lite', desc: 'Nota simple, cargas y documentación técnica antes de señal.' },
      { titulo: 'Escritura', desc: 'Gestora en Andalucía hasta firma notarial.' },
    ],
  },
  alicante: {
    beneficiosTitulo: 'Compra piso Alicante y Costa Blanca — gestoría fija',
    beneficiosIntro:
      'Playa de San Juan, centro y Elche: operaciones con compradores extranjeros donde la documentación técnica se omite con frecuencia.',
    tramitesTitulo: 'Trámites en provincia de Alicante',
    tramitesIntro: 'Revisión conforme Comunitat Valenciana:',
    tramitesLocales: [
      'Cédula de habitabilidad y certificado energético',
      'Situación de vivienda turística en anuncios de costa',
      'Deudas de comunidad en edificios de Playa de San Juan',
    ],
    pasosTitulo: 'Proceso de compra en Alicante',
    pasos: [
      { titulo: 'Llamada con gestor', desc: 'Barrio alicantino, plazos y financiación hipotecaria.' },
      { titulo: '687 € IVA incl.', desc: 'Tarifa fija para compradores de particular.' },
      { titulo: 'Revisión de arras', desc: 'Cláusulas y documentación del vendedor en Costa Blanca.' },
      { titulo: 'Escritura', desc: 'Coordinación hasta notaría en Alicante o Elche.' },
    ],
  },
  zaragoza: {
    beneficiosTitulo: 'Comprar de particular en Zaragoza — 687 €',
    beneficiosIntro:
      'Mercado aragonés con precios más accesibles pero mismos riesgos: arras mal redactadas, cargas ocultas y plazos de hipoteca incoherentes.',
    tramitesTitulo: 'Trámites de compra en Zaragoza',
    tramitesIntro: 'Checklist para capital y área metropolitana:',
    tramitesLocales: [
      'Nota simple del Registro de la Propiedad de Zaragoza',
      'Certificado de eficiencia energética e ITE si aplica',
      'IBI y deudas de comunidad en Delicias o Valdespartera',
    ],
    pasosTitulo: 'Cuatro pasos en Zaragoza',
    pasos: [
      { titulo: 'Análisis inicial', desc: 'Operación en centro, Actur o Valdespartera.' },
      { titulo: '687 € sin comisión', desc: 'Frente a miles de euros de agencia inmobiliaria.' },
      { titulo: 'Arras y docs', desc: 'Revisión de reserva y documentación técnica.' },
      { titulo: 'Escritura', desc: 'Seguimiento hasta firma en notaría zaragozana.' },
    ],
  },
  valladolid: {
    beneficiosTitulo: 'Asesoría compra piso Valladolid entre particulares',
    beneficiosIntro:
      'Mercado castellano estable: operaciones familiares donde la revisión de arras evita pleitos por plazos o cargas registrales.',
    tramitesTitulo: 'Documentación en Valladolid',
    tramitesIntro: 'Trámites habituales en capital castellana:',
    tramitesLocales: [
      'Cédula de habitabilidad y certificado energético',
      'Nota simple y cargas en compraventa de particulares',
      'Plusvalía municipal e IBI antes de escritura',
    ],
    pasosTitulo: 'Proceso en Valladolid',
    pasos: [
      { titulo: 'Consulta', desc: 'Análisis de operación en capital o área.' },
      { titulo: '687 € fijos', desc: 'Sin porcentaje sobre precio del inmueble.' },
      { titulo: 'Revisión legal', desc: 'Arras, reserva y documentación del vendedor.' },
      { titulo: 'Escritura', desc: 'Coordinación con notaría local.' },
    ],
  },
  mallorca: {
    beneficiosTitulo: 'Compra piso Mallorca — normativa balear',
    beneficiosIntro:
      'Palma y municipios costeros: restricciones de compra, vivienda turística y escasez de stock exigen due diligence antes de señal.',
    tramitesTitulo: 'Trámites en Islas Baleares',
    tramitesIntro: 'Documentación específica balear:',
    tramitesLocales: [
      'Depósito en IBAVI cuando corresponde por normativa de alquiler',
      'Situación de vivienda de uso turístico en el inmueble',
      'Cédula de habitabilidad y eficiencia energética balear',
    ],
    pasosTitulo: 'Compra en Mallorca con gestor',
    pasos: [
      { titulo: 'Primera llamada', desc: 'Palma, Calvià o interior — perfil de operación.' },
      { titulo: '687 € plano', desc: 'Alternativa a comisión de agencia insular.' },
      { titulo: 'Revisión documental', desc: 'Cargas, derramas y licencias turísticas.' },
      { titulo: 'Escritura', desc: 'Acompañamiento hasta notaría en Baleares.' },
    ],
  },
  bilbao: {
    beneficiosTitulo: 'Compra piso Bilbao de particular — Bizkaia',
    beneficiosIntro:
      'Indautxu, Casco Viejo y Getxo: mercado con operaciones rápidas donde la nota simple y la fiscalidad foral merecen revisión profesional.',
    tramitesTitulo: 'Trámites de compra en Bizkaia',
    tramitesIntro: 'Adaptado a País Vasco:',
    tramitesLocales: [
      'Nota simple y cargas registrales',
      'Certificado energético e inspecciones en edificios protegidos',
      'Deudas de comunidad en edificios del Casco Viejo',
    ],
    pasosTitulo: 'Proceso en Bilbao',
    pasos: [
      { titulo: 'Consulta 24 h', desc: 'Barrio bilbaíno y condiciones del vendedor.' },
      { titulo: '687 € IVA incl.', desc: 'Sin comisión del 3-5 %.' },
      { titulo: 'Arras revisadas', desc: 'Plazos de hipoteca y cláusulas de arras penitenciales.' },
      { titulo: 'Escritura', desc: 'Coordinación con notaría en Gran Bilbao.' },
    ],
  },
  coruna: {
    beneficiosTitulo: 'Comprar piso en A Coruña sin comisión',
    beneficiosIntro:
      'Ensanche coruñés y Orzán: edificios de piedra con humedades ocultas y cargas que conviene detectar antes de entregar señal.',
    tramitesTitulo: 'Documentación en A Coruña',
    tramitesIntro: 'Checklist gallego:',
    tramitesLocales: [
      'Cédula de habitabilidad y certificado energético',
      'ITE en edificios antiguos del casco histórico',
      'Nota simple del Registro de A Coruña',
    ],
    pasosTitulo: 'Compra en A Coruña paso a paso',
    pasos: [
      { titulo: 'Llamada inicial', desc: 'Operación en Coruña, Ferrol o área.' },
      { titulo: '687 € fijos', desc: 'Gestoría sin porcentaje sobre el piso.' },
      { titulo: 'Revisión arras', desc: 'Documentación técnica y registral gallega.' },
      { titulo: 'Escritura', desc: 'Seguimiento hasta firma notarial.' },
    ],
  },
  murcia: {
    beneficiosTitulo: 'Asesoría compra piso Murcia — particulares',
    beneficiosIntro:
      'Mercado regional con operaciones ágiles: reserva y arras firmadas sin revisar deudas de comunidad o cédula autonómica.',
    tramitesTitulo: 'Trámites en Región de Murcia',
    tramitesIntro: 'Documentación habitual murciana:',
    tramitesLocales: [
      'Cédula de habitabilidad regional',
      'Certificado energético e IBI al día',
      'Deudas de comunidad en edificios del centro y pedanías',
    ],
    pasosTitulo: 'Proceso en Murcia',
    pasos: [
      { titulo: 'Consulta', desc: 'Capital murciana o área metropolitana.' },
      { titulo: '687 € plano', desc: 'Sin comisión de agencia.' },
      { titulo: 'Revisión legal', desc: 'Arras, reserva y nota simple.' },
      { titulo: 'Escritura', desc: 'Coordinación con notaría murciana.' },
    ],
  },
  pamplona: {
    beneficiosTitulo: 'Compra piso Pamplona de particular — Navarra',
    beneficiosIntro:
      'Ensanche e Iturrama: mercado estable con demanda residencial alta. Revisar arras y documentación foral antes de señal.',
    tramitesTitulo: 'Trámites de compra en Navarra',
    tramitesIntro: 'Adaptado a normativa navarra:',
    tramitesLocales: [
      'Cédula de habitabilidad y certificado energético',
      'Nota simple del Registro de Pamplona',
      'Deudas de comunidad e IBI municipal',
    ],
    pasosTitulo: 'Proceso en Pamplona',
    pasos: [
      { titulo: 'Primera llamada', desc: 'Análisis de operación en capital navarra.' },
      { titulo: '687 € IVA incl.', desc: 'Tarifa fija sin comisión.' },
      { titulo: 'Revisión de contratos', desc: 'Reserva, arras y documentación del vendedor.' },
      { titulo: 'Escritura', desc: 'Acompañamiento hasta notaría.' },
    ],
  },
}

/** FAQ base reescrita por ciudad — evita respuestas idénticas en schema.org */
export const ASESORIA_FAQ_BASE_POR_CIUDAD: Record<string, DueDiligenceFaqItem[]> = {
  madrid: [
    { q: '¿Qué incluye la asesoría de compra en Madrid?', a: 'Gestor asignado, revisión de reserva y arras, nota simple del Registro de Madrid, verificación de IEE/ITE en edificios antiguos, coordinación con notaría y seguimiento WhatsApp hasta escritura.' },
    { q: '¿Puedo comprar en Idealista sin pagar comisión?', a: 'Sí, si el anuncio es de particular. Inmonest cubre la parte legal por 687 €: tú negocias el precio; nosotros revisamos contratos y documentación madrileña.' },
    { q: '¿Trabajáis con hipotecas de cualquier banco en Madrid?', a: 'Sí. Incluimos cláusula suspensiva de financiación en arras para operaciones en Getafe, Chamberí o metropolitanos donde la hipoteca tarda semanas.' },
    { q: '¿Conocéis la normativa de la Comunidad de Madrid?', a: 'Sí: depósito de fianza autonómico, IEE en edificios de +50 años, documentación exigible en notaría madrileña y plazos típicos del mercado capitalino.' },
    { q: '¿Cuándo contratar en una operación rápida de Madrid?', a: 'Antes de entregar señal. En Madrid muchas operaciones cierran en 48-72 h — una revisión express evita cláusulas irreversibles.' },
    { q: '¿Qué pasa si hay cargas en la nota simple?', a: 'Informe claro: renegociar precio, exigir cancelación de carga antes de escritura o desistir con arras recuperables si procede.' },
  ],
  barcelona: [
    { q: '¿Qué incluye la asesoría de compra en Barcelona?', a: 'Revisión de reserva y arras, cédula de la Generalitat, ITE pendiente, nota simple, deudas de comunidad y coordinación con notaría barcelonesa hasta escritura.' },
    { q: '¿Puedo comprar de particular en Barcelona sin agencia?', a: 'Sí. Negocias directo con el vendedor; nosotros revisamos la parte legal por 687 € fijos en lugar del 3-5 % de comisión.' },
    { q: '¿La ITE puede bloquear mi compra en Barcelona?', a: 'Sí. Si el edificio del Eixample tiene ITE vencida, notaría puede parar la operación. Lo verificamos antes de que entregues señal.' },
    { q: '¿Conocéis la normativa catalana?', a: 'Sí: cédula de habitabilidad, límites de renta en zona tensionada si compras para alquilar, estatutos de comunidad y requisitos de la Generalitat.' },
    { q: '¿Cuándo debo contratar en Barcelona?', a: 'Idealmente antes de firmar reserva. Si el vendedor presiona con plazo de 24 h, priorizamos revisión express del borrador.' },
    { q: '¿Qué hacéis si detectáis derramas ocultas?', a: 'Informe con importe de derrama, opciones de renegociación de precio o condición en arras para que el vendedor liquide antes de escritura.' },
  ],
  valencia: [
    { q: '¿Qué incluye la asesoría de compra en Valencia?', a: 'Gestor asignado, revisión de arras, cédula valenciana, certificado energético, nota simple, deudas de comunidad y acompañamiento hasta escritura en notaría valenciana.' },
    { q: '¿Comprar de particular en Valencia es seguro?', a: 'Sí con revisión previa. Muchos compradores encuentran piso en portales y contactan directo — cubrimos la capa legal que la agencia haría sin cobrar %.' },
    { q: '¿Revisáis vivienda turística mal declarada?', a: 'Sí. En Valencia capital detectamos inscripciones en Registro de Turisme que afectan al uso del inmueble y a la operación.' },
    { q: '¿Conocéis la normativa valenciana?', a: 'Sí: cédula de habitabilidad de la Generalitat, IEE en edificios antiguos de Ciutat Vella y derramas de rehabilitación de fachada.' },
    { q: '¿Cuándo contratar en Valencia?', a: 'Antes de reserva o inmediatamente después. En Ruzafa y Benimaclet las operaciones van rápido.' },
    { q: '¿Qué pasa con derramas de comunidad?', a: 'Verificamos certificado de deudas; si hay derrama pendiente de 5.000 € o más, renegociamos o condicionamos la compra.' },
  ],
}

export function getAsesoriaCompraEnriquecimiento(slug: string): AsesoriaCompraEnriquecimiento | null {
  return ASESORIA_COMPRA_ENRIQUECIMIENTO[slug] ?? null
}

export function getAsesoriaFaqBasePorCiudad(slug: string, nombre: string, region: string, precioEjemplo: number): DueDiligenceFaqItem[] {
  const especifico = ASESORIA_FAQ_BASE_POR_CIUDAD[slug]
  if (especifico) return especifico

  const comisionMin = Math.round(precioEjemplo * 0.03)
  const comisionMax = Math.round(precioEjemplo * 0.05)

  return [
    {
      q: `¿Qué incluye la asesoría de compra en ${nombre}?`,
      a: `Gestor asignado en ${nombre}, revisión de reserva y arras, nota simple registral, verificación de cédula y certificado energético exigidos en ${region}, coordinación con notaría y seguimiento hasta escritura.`,
    },
    {
      q: `¿Puedo comprar de particular en ${nombre} sin agencia?`,
      a: `Sí. Inmonest no es agencia: 687 € fijos frente a ${comisionMin.toLocaleString('es-ES')}–${comisionMax.toLocaleString('es-ES')} € de comisión (3-5 %) en un piso de ${precioEjemplo.toLocaleString('es-ES')} € en ${nombre}.`,
    },
    {
      q: `¿Trabajáis con hipotecas en ${nombre}?`,
      a: `Sí. Revisamos plazos de arras para que encajen con la aprobación hipotecaria — habitual en operaciones entre particulares en ${nombre}.`,
    },
    {
      q: `¿Conocéis la normativa de ${region}?`,
      a: `Sí. Revisamos documentación exigida en ${nombre}: cédula de habitabilidad, certificado energético, inspecciones técnicas y requisitos autonómicos de ${region}.`,
    },
    {
      q: `¿Cuándo contratar en ${nombre}?`,
      a: `Antes de firmar reserva o justo después. Cuanto antes revisemos en ${nombre}, más margen para renegociar o desistir sin pérdidas.`,
    },
    {
      q: `¿Qué pasa si hay problemas en la documentación en ${nombre}?`,
      a: `Informe claro con opciones: renegociar condiciones, cancelar la compra y recuperar arras si procede, o continuar asumiendo el riesgo con pleno conocimiento.`,
    },
  ]
}
