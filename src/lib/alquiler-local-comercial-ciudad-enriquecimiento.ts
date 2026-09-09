export type PanelClausulaLocal = {
  titulo: string
  estado: string
  nota: string
}

export type BaseLegalLocal = {
  titulo: string
  desc: string
}

export type PasoLocal = {
  num: string
  titulo: string
  desc: string
}

export type AlquilerLocalEnriquecimiento = {
  heroH1: string
  heroLead: string
  inmonestTitulo: string
  inmonestParrafoExtra: string
  basesLegalesTitulo: string
  basesLegalesIntro: string
  basesLegalesLocal: BaseLegalLocal[]
  pasosLocal: PasoLocal[]
  panelClausulas: PanelClausulaLocal[]
  comparativaIntro: string
}

export const ALQUILER_LOCAL_ENRIQUECIMIENTO: Record<string, AlquilerLocalEnriquecimiento> = {
  madrid: {
    heroH1: 'Alquiler de local comercial en Madrid sin comisión de agencia',
    heroLead:
      'Bajos en Malasaña, Chamberí o Vallecas: formaliza tu arrendamiento LAU empresarial con un gestor que conoce licencias del Ayuntamiento de Madrid, terrazas en vía pública e IAE. 145 € IVA incluido, entrega en 48 h.',
    inmonestTitulo: 'Por qué un contrato profesional en Madrid no es opcional',
    inmonestParrafoExtra:
      'En Madrid capital la renta media de un bajo comercial supera los 1.800 €/mes. Un impago, un traspaso no autorizado o una obra no amortizada puede costarte más que un año de alquiler. Redactamos cláusulas de tanteo, retracto y distribución de IBI pensadas para el mercado madrileño — no plantillas de otra ciudad.',
    basesLegalesTitulo: 'Marco legal del local comercial en Madrid',
    basesLegalesIntro:
      'El Título III LAU rige tu operación, pero el Ayuntamiento de Madrid exige licencias, terrazas y actividad compatible. Esto es lo que adaptamos en cada contrato:',
    basesLegalesLocal: [
      {
        titulo: 'Licencia de actividad y apertura municipal',
        desc: 'Cláusula suspensiva si el arrendatario no obtiene licencia en plazo. Habitual en locales de Malasaña convertidos de vivienda o en polígonos del sur.',
      },
      {
        titulo: 'Terrazas y ocupación de vía pública',
        desc: 'Quién solicita autorización, quién paga tasas y qué ocurre si el Ayuntamiento retira la terraza — crítico en hostelería de Chamberí y centro.',
      },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Cuéntanos tu local', desc: 'Barrio madrileño (Malasaña, Tetuán, Vallecas…), actividad, renta y si hay terraza o traspaso previsto.' },
      { num: '02', titulo: 'Revisión LAU empresarial', desc: 'Tu gestor verifica compatibilidad de uso, licencia municipal y cláusulas de tanteo ante venta del inmueble.' },
      { num: '03', titulo: 'Redacción personalizada', desc: 'Contrato adaptado al barrio y actividad: retail, hostelería u oficina en planta baja.' },
      { num: '04', titulo: 'Dudas antes de firmar', desc: 'Llamada o WhatsApp para explicar tanteo, obras y fianza antes de entregar llaves.' },
      { num: '05', titulo: 'PDF firmable en 48 h', desc: 'Entrega con guía de firma para propietario e inquilino en Madrid.' },
    ],
    panelClausulas: [
      { titulo: 'Licencia Ayuntamiento de Madrid', estado: 'Revisada', nota: 'Cláusula suspensiva si no hay licencia de apertura en 60 días.' },
      { titulo: 'Terraza en vía pública', estado: 'Asesorada', nota: 'Reparto de tasas y responsabilidad si se retira autorización municipal.' },
      { titulo: 'Tanteo ante venta del local', estado: 'Ajustada', nota: 'Plazos de notificación conforme LAU en operación de Indautxu-style retail madrileño.' },
    ],
    comparativaIntro: 'En Madrid una agencia puede cobrar el 10 % anual sobre la renta del local. Inmonest cobra 145 € una sola vez por contrato redactado por gestoría.',
  },
  barcelona: {
    heroH1: 'Contrato de local comercial en Barcelona — LAU empresarial',
    heroLead:
      'Eixample, Gràcia o Poblenou: contrato Título III LAU con cláusulas sobre licencia de actividad del Ayuntamiento, terrazas y traspaso de hostelería. Particulares sin pagar comisión inmobiliaria. 145 €.',
    inmonestTitulo: 'Locales en Barcelona: más traspasos, más riesgo sin contrato',
    inmonestParrafoExtra:
      'En Barcelona el traspaso de bares y restaurantes es la norma, no la excepción. Un PDF genérico no regula el derecho de tanteo del propietario, la amortización de obras del inquilino ni la licencia de terraza. Tu gestor redacta pensando en Sant Antoni, el 22@ y L\'Hospitalet.',
    basesLegalesTitulo: 'Bases legales en Barcelona y área metropolitana',
    basesLegalesIntro:
      'Cataluña aplica la LAU estatal con ordenanzas municipales propias. En Barcelona capital esto marca la diferencia en hostelería y retail:',
    basesLegalesLocal: [
      {
        titulo: 'Licencia de actividad — Ajuntament de Barcelona',
        desc: 'Uso comercial compatible con ordenanza urbanística. Especial atención en locales del Eixample en edificios de protección patrimonial.',
      },
      {
        titulo: 'Traspaso de negocio en hostelería',
        desc: 'Limitación, condicionamiento o prohibición del traspaso con derecho de tanteo del arrendador — cláusula estándar en Poblenou y Gràcia.',
      },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Datos del local', desc: 'Barrio barcelonés, actividad (hostelería, retail, oficina), renta pactada y si hay traspaso en marcha.' },
      { num: '02', titulo: 'Análisis normativo local', desc: 'Licencia municipal, terraza y compatibilidad de uso en edificio plurifamiliar comercial.' },
      { num: '03', titulo: 'Redacción LAU Título III', desc: 'Contrato en castellano claro con cláusulas válidas en Cataluña.' },
      { num: '04', titulo: 'Revisión con gestor', desc: 'Resolvemos dudas sobre tanteo, obras y fianza antes de la firma.' },
      { num: '05', titulo: 'Entrega 48 h', desc: 'PDF firmable con inventario y anexos si procede.' },
    ],
    panelClausulas: [
      { titulo: 'Traspaso hostelería', estado: 'Revisada', nota: 'Condiciones de traspaso y tanteo del propietario en bar de Gràcia.' },
      { titulo: 'Terraza y vía pública', estado: 'Asesorada', nota: 'Licencia de terraza y reparto de costes entre arrendador y arrendatario.' },
      { titulo: 'Obras de adecuación', estado: 'Ajustada', nota: 'Amortización de reforma de local en Poblenou ante resolución anticipada.' },
    ],
    comparativaIntro: 'Una gestoría tradicional en Barcelona puede facturar 400–800 € por contrato comercial. Inmonest: 145 € con gestor asignado y panel de seguimiento.',
  },
  valencia: {
    heroH1: 'Alquiler local comercial Valencia — contrato LAU 145 €',
    heroLead:
      'Ruzafa, Ciutat Vella o Benimaclet: arrendamiento de bajo comercial con cláusulas sobre terrazas hosteleras, licencia de la Generalitat y traspaso. Gestor valenciano asignado.',
    inmonestTitulo: 'Hostelería en Valencia: terraza y traspaso mal regulados',
    inmonestParrafoExtra:
      'En Ruzafa y el centro muchos locales viven de la terraza. Si el contrato no dice quién pide licencia, quién paga tasas y qué pasa si el Ayuntamiento retira la autorización, el conflicto llega tarde y caro. Redactamos para el mercado valenciano real.',
    basesLegalesTitulo: 'Normativa del local comercial en Valencia',
    basesLegalesIntro: 'Comunitat Valenciana + ordenanza municipal de Valencia capital:',
    basesLegalesLocal: [
      { titulo: 'Licencia Generalitat y Ayuntamiento', desc: 'Actividad compatible y plazos para obtener apertura antes de iniciar negocio en el local.' },
      { titulo: 'Terrazas en hostelería valenciana', desc: 'Regulación de veladores, responsabilidad y costes en Ciutat Vella y zona portuaria.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Describe el local', desc: 'Barrio valenciano, actividad y si dependes de terraza o traspaso de negocio.' },
      { num: '02', titulo: 'Revisión jurídica', desc: 'LAU empresarial + licencias autonómicas y municipales aplicables.' },
      { num: '03', titulo: 'Contrato personalizado', desc: 'Cláusulas para retail o hostelería en l\'Horta y capital.' },
      { num: '04', titulo: 'Asesoramiento previo', desc: 'Consultas por WhatsApp antes de firmar y entregar fianza.' },
      { num: '05', titulo: 'PDF en 48 h', desc: 'Documento listo para firma entre particulares.' },
    ],
    panelClausulas: [
      { titulo: 'Terraza hostelería', estado: 'Revisada', nota: 'Licencia y tasas en bar de Ruzafa con veladores en vía pública.' },
      { titulo: 'Actividad turística vs comercial', estado: 'Asesorada', nota: 'Uso compatible con licencia municipal en Ciutat Vella.' },
      { titulo: 'IBI y comunidad', estado: 'Ajustada', nota: 'Reparto de gastos en local de Benimaclet con cuota elevada.' },
    ],
    comparativaIntro: 'En Valencia la renta media orientativa de un bajo comercial ronda 1.200 €/mes. Un contrato profesional cuesta 145 € — una fracción de un mes de comisión de agencia.',
  },
  sevilla: {
    heroH1: 'Contrato alquiler local comercial Sevilla — gestoría 145 €',
    heroLead:
      'Triana, Nervión o centro histórico: LAU empresarial para propietarios y autónomos andaluces. IBI, comunidad, traspaso y licencia del Ayuntamiento de Sevilla incluidos en la redacción.',
    inmonestTitulo: 'Triana y Nervión: IBI y traspaso mal pactados',
    inmonestParrafoExtra:
      'En Sevilla muchos arrendamientos comerciales se cierran de palabra. Cuando llega el impago o el traspaso de bar, la ausencia de cláusulas sobre IBI, basuras y obras deja al propietario desprotegido. Carmen, nuestra gestora en Andalucía, adapta cada contrato al barrio sevillano.',
    basesLegalesTitulo: 'Alquiler comercial en Sevilla y área metropolitana',
    basesLegalesIntro: 'Título III LAU con práctica habitual en capital y metropolitanos:',
    basesLegalesLocal: [
      { titulo: 'IBI y gastos de comunidad', desc: 'Distribución clara en locales de Triana con cuotas de comunidad elevadas en edificios históricos.' },
      { titulo: 'Licencia de actividad — Ayuntamiento de Sevilla', desc: 'Condición suspensiva y plazos en apertura de hostelería en centro y Los Remedios.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Información del local', desc: 'Zona sevillana, actividad, renta y situación de traspaso si existe.' },
      { num: '02', titulo: 'Análisis LAU', desc: 'Revisión de tanteo, obras y fianza conforme mercado andaluz.' },
      { num: '03', titulo: 'Redacción', desc: 'Contrato personalizado para bajo comercial o nave ligera.' },
      { num: '04', titulo: 'Consulta con gestora', desc: 'Dudas resueltas antes de firma — Carmen, especialista Andalucía.' },
      { num: '05', titulo: 'Entrega PDF', desc: '48 h laborables con guía para ambas partes.' },
    ],
    panelClausulas: [
      { titulo: 'IBI y basuras', estado: 'Revisada', nota: 'Reparto pactado en local de Nervión con IBI anual elevado.' },
      { titulo: 'Traspaso de bar', estado: 'Asesorada', nota: 'Tanteo del propietario en hostelería de Triana.' },
      { titulo: 'Obras de adecuación', estado: 'Ajustada', nota: 'Amortización en local del centro histórico.' },
    ],
    comparativaIntro: 'En Sevilla la renta media de un bajo ronda 950 €/mes. Evita el 10 % de comisión anual de agencia con un contrato único de 145 €.',
  },
  malaga: {
    heroH1: 'Local comercial Málaga — contrato LAU Costa del Sol',
    heroLead:
      'Centro, Soho o Costa del Sol: arrendamiento comercial con cláusulas sobre turismo, terrazas y licencia de la Junta de Andalucía. 145 € para particulares sin agencia.',
    inmonestTitulo: 'Turismo y comercio en Málaga: no uses contrato de vivienda',
    inmonestParrafoExtra:
      'En el centro y Soho conviven retail, hostelería y actividad vinculada al turismo. Mezclar régimen LAU de vivienda con local comercial o VFT genera cláusulas nulas. Redactamos el Título III correcto con Carmen, gestora en Andalucía.',
    basesLegalesTitulo: 'Normativa comercial en Málaga y provincia',
    basesLegalesIntro: 'Junta de Andalucía + Ayuntamiento de Málaga:',
    basesLegalesLocal: [
      { titulo: 'Terrazas en centro y Soho', desc: 'Licencia municipal, tasas y responsabilidad si se retira autorización de veladores.' },
      { titulo: 'Actividad turística vs LAU empresarial', desc: 'Distinción de régimen en locales con doble uso en zona portuaria y histórica.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Tu local en Málaga', desc: 'Barrio, actividad (hostelería, retail), renta y terraza.' },
      { num: '02', titulo: 'Revisión normativa', desc: 'LAU empresarial y licencias andaluzas aplicables.' },
      { num: '03', titulo: 'Redacción a medida', desc: 'Contrato para Costa del Sol o capital malagueña.' },
      { num: '04', titulo: 'Gestora asignada', desc: 'Carmen resuelve dudas antes de firmar.' },
      { num: '05', titulo: 'PDF 48 h', desc: 'Entrega firmable digitalmente.' },
    ],
    panelClausulas: [
      { titulo: 'Terraza centro histórico', estado: 'Revisada', nota: 'Tasas y licencia en bar de Soho.' },
      { titulo: 'VFT vs comercial', estado: 'Asesorada', nota: 'Uso correcto en local con actividad turística.' },
      { titulo: 'Traspaso hostelería', estado: 'Ajustada', nota: 'Condiciones en local de La Malagueta.' },
    ],
    comparativaIntro: 'En Málaga capital la renta orientativa supera 1.100 €/mes en zonas céntricas. 145 € por contrato vs comisión recurrente de agencia.',
  },
  bilbao: {
    heroH1: 'Alquiler local comercial Bilbao — Bizkaia LAU 145 €',
    heroLead:
      'Casco Viejo, Indautxu o Deusto: contrato LAU empresarial con Hacienda Foral, licencia municipal y cláusulas de traspaso en hostelería vasca. Particulares sin intermediarios.',
    inmonestTitulo: 'Casco Viejo: patrimonio y uso comercial',
    inmonestParrafoExtra:
      'En el Casco Viejo de Bilbao muchos locales están en edificios protegidos. Las obras de adecuación, el traspaso de taberna y el tanteo ante venta requieren cláusulas específicas que una plantilla de Madrid no contempla. Conocemos la práctica en Bizkaia.',
    basesLegalesTitulo: 'Marco legal en Bilbao y Hacienda Foral',
    basesLegalesIntro: 'LAU estatal + urbanismo y fiscalidad foral:',
    basesLegalesLocal: [
      { titulo: 'Patrimonio en Casco Viejo', desc: 'Restricciones urbanísticas y obras en edificio histórico antes de abrir actividad comercial.' },
      { titulo: 'IAE — Hacienda Foral de Bizkaia', desc: 'Orientación sobre alta del arrendatario y epígrafe según actividad en Indautxu o Abando.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Local en Bizkaia', desc: 'Barrio bilbaíno, actividad y renta acordada.' },
      { num: '02', titulo: 'Revisión foral y LAU', desc: 'Cláusulas válidas en País Vasco con licencia municipal.' },
      { num: '03', titulo: 'Redacción', desc: 'Contrato para hostelería, retail u oficina en planta baja.' },
      { num: '04', titulo: 'Gestor Daniel', desc: 'Consultas antes de firma por teléfono o WhatsApp.' },
      { num: '05', titulo: 'Entrega 48 h', desc: 'PDF personalizado, no plantilla.' },
    ],
    panelClausulas: [
      { titulo: 'Edificio protegido', estado: 'Revisada', nota: 'Obras compatibles en local del Casco Viejo.' },
      { titulo: 'Traspaso taberna', estado: 'Asesorada', nota: 'Tanteo del propietario en hostelería de Indautxu.' },
      { titulo: 'Registro renta > 9.000 €', estado: 'Ajustada', nota: 'Obligación de inscripción explicada al arrendador.' },
    ],
    comparativaIntro: 'En Bilbao la renta media orientativa ronda 1.400 €/mes. Un contrato LAU profesional cuesta 145 € — menos que un mes de gestión de agencia.',
  },
  zaragoza: {
    heroH1: 'Contrato local comercial Zaragoza — LAU desde 145 €',
    heroLead:
      'Centro, Delicias o Valdespartera: arrendamiento de bajo o nave ligera entre particulares con cláusulas de tanteo, obras y licencia del Ayuntamiento de Zaragoza.',
    inmonestTitulo: 'Zaragoza: polígonos y bajos del centro',
    inmonestParrafoExtra:
      'Zaragoza combina bajos del centro con locales en Valdespartera y polígonos. El Título III LAU cubre ambos, pero las cláusulas de uso, IAE y obras cambian. Redactamos para el mercado aragonés con rentas más accesibles que Madrid o Barcelona.',
    basesLegalesTitulo: 'Alquiler comercial en Zaragoza y área metropolitana',
    basesLegalesIntro: 'LAU empresarial + licencia municipal zaragozana:',
    basesLegalesLocal: [
      { titulo: 'Locales en polígono o nave ligera', desc: 'Uso industrial ligero vs comercial — cláusulas según actividad y licencia en Actur o Monzalbarba.' },
      { titulo: 'Licencia Ayuntamiento de Zaragoza', desc: 'Plazos de apertura y condición resolutoria si no se obtiene actividad.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Datos del inmueble', desc: 'Centro, Delicias o polígono — actividad y renta.' },
      { num: '02', titulo: 'Análisis LAU', desc: 'Tanteo, obras y traspaso en mercado aragonés.' },
      { num: '03', titulo: 'Redacción', desc: 'Contrato para bajo comercial o nave según caso.' },
      { num: '04', titulo: 'Gestor asignado', desc: 'Dudas resueltas antes de entregar llaves.' },
      { num: '05', titulo: 'PDF 48 h', desc: 'Entrega con anexos si hay inventario de maquinaria.' },
    ],
    panelClausulas: [
      { titulo: 'Uso en polígono', estado: 'Revisada', nota: 'Actividad compatible en nave de Actur.' },
      { titulo: 'Tanteo y venta', estado: 'Asesorada', nota: 'Notificación al arrendatario en local del centro.' },
      { titulo: 'Obras de adecuación', estado: 'Ajustada', nota: 'Amortización en local de Delicias.' },
    ],
    comparativaIntro: 'En Zaragoza la renta orientativa de un bajo ronda 850 €/mes. 145 € por contrato redactado por gestoría vs cientos de euros de plantilla legal tradicional.',
  },
  alicante: {
    heroH1: 'Alquiler local comercial Alicante — Explanada y Costa Blanca',
    heroLead:
      'Explanada, Mercado Central o Elche: contrato LAU empresarial con terrazas portuarias, traspaso de hostelería y licencia del Ayuntamiento de Alicante. 145 € IVA incluido.',
    inmonestTitulo: 'Explanada y puerto: terraza mal regulada',
    inmonestParrafoExtra:
      'En la Explanada de España muchos bares dependen de la terraza en vía pública. El contrato debe decir quién tramita licencia, quién paga tasas y qué ocurre si el Ayuntamiento retira veladores. También cubrimos Elche, San Vicente y polígonos de la Costa Blanca.',
    basesLegalesTitulo: 'Normativa comercial en Alicante y provincia',
    basesLegalesIntro: 'Comunitat Valenciana + ordenanzas de Alicante y Elche:',
    basesLegalesLocal: [
      { titulo: 'Terrazas en Explanada y puerto', desc: 'Ocupación de vía pública, tasas y responsabilidad en hostelería portuaria alicantina.' },
      { titulo: 'Traspaso de bar y retail', desc: 'Derecho de tanteo del propietario en traspasos frecuentes del centro y Mercado Central.' },
    ],
    pasosLocal: [
      { num: '01', titulo: 'Tu local alicantino', desc: 'Explanada, centro, Elche o San Vicente — actividad y terraza.' },
      { num: '02', titulo: 'Revisión LAU + licencias', desc: 'Generalitat y Ayuntamiento según municipio.' },
      { num: '03', titulo: 'Redacción', desc: 'Contrato para hostelería costera o retail urbano.' },
      { num: '04', titulo: 'Gestor asignado', desc: 'Consultas previas a la firma.' },
      { num: '05', titulo: 'PDF 48 h', desc: 'Documento firmable entre particulares.' },
    ],
    panelClausulas: [
      { titulo: 'Terraza Explanada', estado: 'Revisada', nota: 'Licencia y tasas en bar frente al puerto.' },
      { titulo: 'Traspaso hostelería', estado: 'Asesorada', nota: 'Tanteo en local del Mercado Central.' },
      { titulo: 'Local en Elche polígono', estado: 'Ajustada', nota: 'Uso comercial en nave ligera con IAE correcto.' },
    ],
    comparativaIntro: 'En Alicante capital la renta orientativa ronda 980 €/mes. 145 € por contrato LAU vs comisión del 10 % anual de agencia sobre esa renta.',
  },
}

export function getAlquilerLocalEnriquecimiento(slug: string): AlquilerLocalEnriquecimiento | null {
  return ALQUILER_LOCAL_ENRIQUECIMIENTO[slug] ?? null
}
