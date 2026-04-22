import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'

const BASE_URL = 'https://inmonest.com'

interface ServiceData {
  nombre: string
  precio: number
  categoria: string
  tagline: string
  descripcion: string
  image: string
  imageAlt: string
  paraQuien: string[]
  incluye: string[]
  pasos: Array<{ num: string; titulo: string; desc: string }>
  faq: Array<{ q: string; a: string }>
  relacionados: Array<{ slug: string; nombre: string; precio: number }>
}

const SERVICIOS: Record<string, ServiceData> = {
  'arras-penitenciales': {
    nombre: 'Contrato de Arras Penitenciales',
    precio: 120,
    categoria: 'Compraventa',
    tagline: 'El estándar de oro en la compraventa de inmuebles',
    descripcion:
      'El contrato de arras penitenciales es el documento precontractual más utilizado en España para formalizar la intención de compraventa de un inmueble. Permite a cualquiera de las dos partes desistir del acuerdo: el comprador pierde la señal entregada, y el vendedor debe devolver el doble si es él quien se echa atrás. Esta doble penalización lo convierte en la herramienta de seguridad jurídica más equilibrada del mercado inmobiliario español.',
    image: '/gestoria/gestoria1.jpg',
    imageAlt: 'Firma de contrato de arras penitenciales',
    paraQuien: [
      'Compradores que quieren reservar un inmueble con garantías reales',
      'Vendedores que desean asegurar la operación sin cerrarla definitivamente',
      'Cualquier operación donde aún quede financiación hipotecaria pendiente de aprobar',
      'Situaciones donde se necesiten semanas para preparar la escritura notarial',
    ],
    incluye: [
      'Redacción personalizada con datos reales de las partes',
      'Revisión de nota simple registral del inmueble',
      'Cláusulas de desistimiento y penalización estándar',
      'Condiciones suspensivas (hipoteca, licencias, etc.)',
      'Plazo de firma de escritura pública incluido',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Rellena el formulario con los datos básicos de comprador, vendedor e inmueble. Solo tarda 3 minutos.' },
      { num: '02', titulo: 'Revisión por abogado', desc: 'Nuestro equipo jurídico revisa la nota simple, confirma los datos y redacta el contrato personalizado.' },
      { num: '03', titulo: 'Recibe el documento', desc: 'En menos de 48h tienes el PDF listo para firmar digitalmente. Incluimos guía de firma para ambas partes.' },
    ],
    faq: [
      {
        q: '¿Qué pasa si el banco no aprueba la hipoteca?',
        a: 'Depende de si incluiste una cláusula suspensiva por financiación. Nuestro contrato la incorpora por defecto: si el banco deniega la hipoteca, el comprador recupera la señal sin penalización.',
      },
      {
        q: '¿Cuánto suele ser la señal de arras?',
        a: 'Habitualmente entre el 5 % y el 10 % del precio de venta. No hay cantidad mínima legal, aunque por debajo del 5 % pierde fuerza disuasoria para el vendedor.',
      },
      {
        q: '¿Las arras penitenciales son lo mismo que las confirmatorias?',
        a: 'No. Las penitenciales permiten desistir con penalización económica. Las confirmatorias obligan al cumplimiento del contrato y abren la puerta a exigir cumplimiento forzoso.',
      },
      {
        q: '¿Necesito notario para las arras?',
        a: 'No. El contrato de arras es válido con firma privada entre las partes. Solo la escritura de compraventa definitiva requiere notario.',
      },
    ],
    relacionados: [
      { slug: 'arras-confirmatorias', nombre: 'Arras Confirmatorias', precio: 120 },
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
    ],
  },

  'arras-confirmatorias': {
    nombre: 'Contrato de Arras Confirmatorias',
    precio: 120,
    categoria: 'Compraventa',
    tagline: 'El contrato más vinculante: ambas partes se comprometen sin marcha atrás',
    descripcion:
      'El contrato de arras confirmatorias es el más exigente jurídicamente en la compraventa de inmuebles. A diferencia de las arras penitenciales, no permite que ninguna de las partes desista pagando una penalización: si una parte incumple, la otra puede exigir el cumplimiento forzoso del contrato ante los tribunales o resolver el contrato y exigir daños y perjuicios. Es el contrato ideal cuando ambas partes tienen la certeza absoluta de querer cerrar la operación y no necesitan margen de desistimiento.',
    image: '/gestoria/gestoria3.jpg',
    imageAlt: 'Firma de contrato de arras confirmatorias',
    paraQuien: [
      'Comprador y vendedor que han confirmado todo y quieren el máximo compromiso',
      'Operaciones donde la financiación ya está aprobada por el banco',
      'Casos en que se quiere disuadir cualquier intento de marcha atrás',
      'Vendedores que ya han rechazado otras ofertas en favor de este comprador',
    ],
    incluye: [
      'Redacción personalizada con datos reales de las partes',
      'Cláusulas de obligación de cumplimiento para ambas partes',
      'Condiciones de resolución e indemnización por incumplimiento',
      'Revisión de nota simple registral del inmueble',
      'Plazo para otorgamiento de escritura pública',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Completa el formulario con los datos del comprador, vendedor e inmueble. Tardas menos de 5 minutos.' },
      { num: '02', titulo: 'Redacción por abogado', desc: 'Nuestros abogados revisan los datos registrales y redactan el contrato adaptado a tu operación específica.' },
      { num: '03', titulo: 'Entrega en 48h', desc: 'Recibes el PDF firmable digitalmente con instrucciones para ambas partes. Sin desplazamientos ni notaría.' },
    ],
    faq: [
      {
        q: '¿Qué ocurre si una de las partes incumple?',
        a: 'La parte cumplidora puede exigir cumplimiento forzoso del contrato judicialmente, o resolverlo y reclamar daños y perjuicios. No existe la opción de "pagar y marcharse" como en las arras penitenciales.',
      },
      {
        q: '¿Cuándo es mejor elegir arras confirmatorias frente a penitenciales?',
        a: 'Cuando ambas partes tienen absoluta certeza de querer cerrar la venta, la financiación ya está garantizada y no queda ningún condicionante externo que pueda impedirla.',
      },
      {
        q: '¿Se pueden incluir condiciones suspensivas?',
        a: 'Sí, aunque es menos habitual. Si el contrato incluye una condición suspensiva (por ejemplo, aprobación de hipoteca), el incumplimiento de esa condición puede resolver el contrato sin penalización.',
      },
      {
        q: '¿Cuánto dura el plazo habitual hasta escritura?',
        a: 'Normalmente entre 30 y 90 días desde la firma de las arras. Nuestro contrato incluye el plazo acordado y las consecuencias de su incumplimiento.',
      },
    ],
    relacionados: [
      { slug: 'arras-penitenciales', nombre: 'Arras Penitenciales', precio: 120 },
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
    ],
  },

  'contrato-alquiler': {
    nombre: 'Contrato de Alquiler de Vivienda (LAU)',
    precio: 90,
    categoria: 'Alquiler',
    tagline: 'El contrato de alquiler más completo, adaptado a la Ley de Vivienda 2026',
    descripcion:
      'El contrato de alquiler de vivienda habitual está regulado por la Ley de Arrendamientos Urbanos (LAU) y la Ley de Vivienda de 2023 con sus actualizaciones de 2026. Un contrato mal redactado puede suponer años de problemas: cláusulas nulas, actualizaciones de renta incorrectas, imposibilidad de recuperar el piso o disputas por la fianza. Nuestro equipo jurídico redacta contratos personalizados que protegen al propietario y cumplen con todos los derechos del inquilino exigidos por ley.',
    image: '/gestoria/gestoria7.jpg',
    imageAlt: 'Contrato de alquiler de vivienda entre particulares',
    paraQuien: [
      'Propietarios que van a alquilar su piso por primera vez',
      'Arrendadores que tienen contratos antiguos y quieren actualizarlos',
      'Inquilinos que quieren revisar las condiciones antes de firmar',
      'Cualquier alquiler de vivienda habitual de larga duración en España',
    ],
    incluye: [
      'Adaptado a la Ley de Vivienda 2026 y LAU vigente',
      'Cláusulas de actualización de renta (IPC limitado)',
      'Fianza legal y garantías adicionales opcionales',
      'Anexo de inventario de mobiliario y estado del inmueble',
      'Régimen de obras, mascotas y subarrendamiento',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita los datos del propietario, inquilino, piso y condiciones económicas. El formulario es guiado y claro.' },
      { num: '02', titulo: 'Redacción personalizada', desc: 'Nuestros abogados redactan un contrato a medida, verificando que todas las cláusulas cumplen la legislación vigente.' },
      { num: '03', titulo: 'Listo para firmar', desc: 'Recibes el contrato PDF en 48h, firmable digitalmente. El inventario de mobiliario se incluye como anexo.' },
    ],
    faq: [
      {
        q: '¿Cuánto puede actualizarse el alquiler cada año?',
        a: 'Desde 2024, los grandes tenedores están limitados al IPC negociado (máx. 3 %). Para pequeños propietarios, el límite es el IPC + 2 %. Nuestro contrato incorpora la fórmula correcta según tu caso.',
      },
      {
        q: '¿Cuánto tiempo dura el contrato de alquiler mínimo?',
        a: 'La LAU establece una duración mínima de 5 años para personas físicas y 7 para personas jurídicas, con prórrogas tácitas anuales. Puedes acordar duraciones superiores pero no inferiores.',
      },
      {
        q: '¿Qué fianza es obligatoria?',
        a: 'Una mensualidad de renta como fianza legal mínima. Adicionalmente, propietario e inquilino pueden acordar garantías adicionales (hasta 2 mensualidades según la LAU).',
      },
      {
        q: '¿El contrato sirve si el piso está en zona tensionada?',
        a: 'Sí. Adaptamos el contrato a la regulación específica de zonas tensionadas (Barcelona, Madrid, Cataluña, etc.) donde aplican límites adicionales de precio.',
      },
    ],
    relacionados: [
      { slug: 'arras-penitenciales', nombre: 'Arras Penitenciales', precio: 120 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
      { slug: 'arras-confirmatorias', nombre: 'Arras Confirmatorias', precio: 120 },
    ],
  },

  'rescision-alquiler': {
    nombre: 'Contrato de Rescisión de Alquiler',
    precio: 60,
    categoria: 'Rescisión y fianzas',
    tagline: 'Cierra el alquiler sin conflictos: llaves, estado y fianza en un solo documento',
    descripcion:
      'Cuando termina un contrato de alquiler, la mayoría de los conflictos surgen por la falta de documentación del estado del piso en el momento de la entrega de llaves. Sin un acta de rescisión correctamente firmada, el propietario puede tener dificultades para retener parte de la fianza por daños, y el inquilino no tiene garantías de que se le devuelva íntegramente. Nuestro contrato de rescisión documenta el estado real del inmueble, liquida la fianza y cierra definitivamente la relación arrendaticia.',
    image: '/gestoria/gestoria5.jpg',
    imageAlt: 'Entrega de llaves y rescisión de contrato de alquiler',
    paraQuien: [
      'Propietarios que recuperan su piso al finalizar el contrato',
      'Inquilinos que quieren garantías de devolución íntegra de la fianza',
      'Situaciones donde hay desacuerdo sobre el estado del inmueble',
      'Rescisión anticipada de mutuo acuerdo entre propietario e inquilino',
    ],
    incluye: [
      'Acta de estado del inmueble con descripción detallada',
      'Acuerdo de liquidación y devolución de fianza',
      'Cláusula de renuncia mutua a reclamaciones futuras',
      'Fecha de entrega de llaves y lectura de contadores',
      'Desglose opcional de conceptos descontados de la fianza',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el documento', desc: 'Facilita los datos del contrato original, fecha de salida y acuerdo sobre la fianza. Proceso guiado en 5 minutos.' },
      { num: '02', titulo: 'Redacción del acta', desc: 'Elaboramos el acta de rescisión con todos los detalles del estado del inmueble y la liquidación económica acordada.' },
      { num: '03', titulo: 'Cierre sin disputas', desc: 'Ambas partes firman digitalmente. El documento protege legalmente a propietario e inquilino frente a reclamaciones posteriores.' },
    ],
    faq: [
      {
        q: '¿En qué plazo debe devolver la fianza el propietario?',
        a: 'La LAU establece un plazo máximo de un mes desde la entrega de llaves. Si el propietario no devuelve la fianza en ese plazo, el inquilino puede reclamar la fianza más el interés legal del dinero.',
      },
      {
        q: '¿Puede el propietario retener parte de la fianza?',
        a: 'Sí, si hay daños que superan el desgaste normal por uso, facturas de suministros pendientes o rentas impagadas. Nuestro documento detalla con precisión qué se retiene y por qué, evitando reclamaciones posteriores.',
      },
      {
        q: '¿Qué pasa si el inquilino se marcha antes de que acabe el contrato?',
        a: 'Si hay mutuo acuerdo, nuestro documento regula también la rescisión anticipada: posibles penalizaciones, devolución proporcional y condiciones de salida pactadas.',
      },
      {
        q: '¿Este documento vale para recuperar la fianza depositada en el organismo autonómico?',
        a: 'El acta de rescisión es el documento previo necesario. Para recuperar la fianza del organismo público (Incasol, IVIMA, etc.) necesitas además el formulario oficial de tu comunidad autónoma, que también gestionamos.',
      },
    ],
    relacionados: [
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
      { slug: 'arras-penitenciales', nombre: 'Arras Penitenciales', precio: 120 },
      { slug: 'arras-confirmatorias', nombre: 'Arras Confirmatorias', precio: 120 },
    ],
  },

  'alquiler-habitaciones': {
    nombre: 'Contrato de Alquiler de Habitación',
    precio: 100,
    categoria: 'Alquiler',
    tagline: 'Alquila habitaciones en piso compartido con todas las garantías jurídicas',
    descripcion:
      'El alquiler de habitaciones dentro de una vivienda no queda plenamente amparado por la LAU (que protege la vivienda habitual completa), sino que se rige por el Código Civil y los pactos entre las partes. Esa flexibilidad puede convertirse en un problema si el contrato no está bien redactado: convivencia conflictiva, disputas sobre zonas comunes, fianzas no devueltas o inquilinos que se niegan a marcharse. Nuestro equipo redacta contratos de habitación que regulan con precisión cada aspecto, protegiendo tanto al propietario como al inquilino desde el primer día.',
    image: '/gestoria/gestoria6.jpg',
    imageAlt: 'Contrato de alquiler de habitación en piso compartido',
    paraQuien: [
      'Propietarios que alquilan habitaciones de su vivienda habitual',
      'Gestores de coliving o pisos compartidos con varios inquilinos',
      'Inquilinos que quieren revisar condiciones antes de firmar',
      'Situaciones de sustitución de habitante o incorporación de nuevo compañero',
    ],
    incluye: [
      'Regulación de uso de zonas comunes (cocina, baño, salón)',
      'Normas de convivencia y prohibiciones pactadas',
      'Fianza, condiciones de devolución y estado inicial',
      'Duración, prórrogas y condiciones de salida anticipada',
      'Cláusula de sustitución de habitante si procede',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita datos del propietario, inquilino, habitación y normas de la vivienda. El formulario es guiado y rápido.' },
      { num: '02', titulo: 'Redacción personalizada', desc: 'Nuestros gestores adaptan el contrato a tu situación: número de habitantes, zonas comunes, duración pactada y fianza.' },
      { num: '03', titulo: 'Listo para firmar', desc: 'Recibes el PDF en 48h, firmable digitalmente por todas las partes. Incluye inventario de la habitación como anexo.' },
    ],
    faq: [
      {
        q: '¿Los contratos de habitación se rigen por la LAU?',
        a: 'No directamente. La LAU protege el arrendamiento de vivienda habitual completa. El alquiler de habitaciones se rige por el Código Civil (art. 1542 y siguientes) y los acuerdos entre partes, con más libertad pero también más riesgo sin contrato escrito.',
      },
      {
        q: '¿Cuánta fianza debo pedir por una habitación?',
        a: 'No hay mínimo legal fijado, pero lo habitual es una mensualidad. Nuestro contrato incluye la cláusula de fianza y el procedimiento de devolución para evitar conflictos al finalizar.',
      },
      {
        q: '¿Puedo poner normas de convivencia en el contrato?',
        a: 'Sí, y es muy recomendable. El contrato puede incluir normas sobre uso de zonas comunes, horarios de silencio, invitados, mascotas o limpieza. Todo lo que se regule en el contrato es exigible legalmente.',
      },
      {
        q: '¿Qué ocurre si el inquilino se niega a marcharse?',
        a: 'Sin contrato escrito, el proceso de desahucio es más complejo. Con nuestro contrato, la fecha de fin y las condiciones de salida quedan claras, lo que facilita enormemente cualquier reclamación legal.',
      },
    ],
    relacionados: [
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
      { slug: 'alquiler-local-comercial', nombre: 'Alquiler Local Comercial', precio: 100 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
    ],
  },

  'alquiler-local-comercial': {
    nombre: 'Contrato de Alquiler de Local Comercial',
    precio: 100,
    categoria: 'Alquiler',
    tagline: 'Protege tu negocio con un contrato adaptado a la LAU empresarial',
    descripcion:
      'El alquiler de locales comerciales se rige por el Título III de la LAU (uso distinto de vivienda), donde la libertad de pactos entre las partes es mucho mayor que en el alquiler residencial. Sin embargo, esa libertad puede ser un arma de doble filo: sin cláusulas bien redactadas, el arrendatario puede quedarse sin derecho de traspaso, sin derecho de tanteo ante una venta, con rentas que escalan muy por encima del IPC o con obligaciones de obra injustas. Nuestro equipo jurídico protege tanto al propietario del local como al empresario que va a desarrollar allí su actividad.',
    image: '/gestoria/gestoria2.jpg',
    imageAlt: 'Firma de contrato de alquiler de local comercial',
    paraQuien: [
      'Propietarios de locales comerciales o bajos que quieren arrendar',
      'Empresarios, autónomos y pymes que van a abrir un negocio',
      'Operaciones con obras iniciales o adaptaciones del local',
      'Arrendamientos con renta variable o ligada a facturación',
    ],
    incluye: [
      'Régimen LAU para uso distinto de vivienda',
      'Actualización de renta libre o por IPC según pacto',
      'Régimen de obras, mejoras y estado inicial del local',
      'Derecho de tanteo y retracto ante venta del local',
      'Garantías adicionales (aval bancario, depósito)',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita los datos del propietario, arrendatario, local y condiciones económicas. Incluye la actividad que vas a desarrollar.' },
      { num: '02', titulo: 'Revisión por abogado', desc: 'Nuestros abogados verifican la compatibilidad del uso con la licencia, redactan el contrato y lo adaptan a las condiciones pactadas.' },
      { num: '03', titulo: 'Entrega en 48h', desc: 'Recibes el PDF firmable con todas las cláusulas específicas para actividades comerciales. Sin letra pequeña.' },
    ],
    faq: [
      {
        q: '¿Cuánto tiempo dura mínimo un contrato de local comercial?',
        a: 'No hay duración mínima legal para locales comerciales, a diferencia del alquiler de vivienda. La duración es la que acuerden las partes. Lo más habitual es 1 a 5 años con opción de prórroga.',
      },
      {
        q: '¿Puede el arrendatario traspasar el negocio?',
        a: 'Sí, salvo que el contrato lo prohíba expresamente. Si el contrato permite el traspaso, el propietario tiene derecho de tanteo (adquirirlo en iguales condiciones). Nuestro contrato regula este derecho con precisión.',
      },
      {
        q: '¿Quién paga las obras del local?',
        a: 'Depende de lo pactado. Es habitual que el inquilino realice obras de adaptación al inicio. Nuestro contrato regula quién paga las obras, si se amortiza en la renta y qué pasa con las mejoras al finalizar el contrato.',
      },
      {
        q: '¿Puede el propietario subir la renta libremente?',
        a: 'En locales comerciales, la actualización de renta es libre y se rige por lo pactado en el contrato. Si no se pacta nada, se aplica el IPC. Nuestro contrato especifica la fórmula exacta de actualización para evitar sorpresas.',
      },
    ],
    relacionados: [
      { slug: 'alquiler-habitaciones', nombre: 'Alquiler de Habitación', precio: 100 },
      { slug: 'alquiler-garaje-trastero', nombre: 'Garaje o Trastero', precio: 40 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
    ],
  },

  'alquiler-opcion-compra': {
    nombre: 'Contrato de Alquiler con Opción a Compra',
    precio: 150,
    categoria: 'Compraventa',
    tagline: 'Alquila ahora, compra cuando quieras: el contrato más versátil del mercado',
    descripcion:
      'El alquiler con opción a compra es un contrato doble: por un lado regula el arrendamiento de la vivienda durante un período determinado; por otro, otorga al inquilino el derecho exclusivo e irrevocable de adquirirla en ese plazo a un precio previamente pactado, descontando todo o parte de las rentas abonadas. Es la solución ideal para compradores que aún no tienen financiación hipotecaria definitiva pero quieren asegurarse la propiedad, y para vendedores que quieren generar ingresos durante el proceso de venta sin renunciar a ella.',
    image: '/gestoria/gestoria4.jpg',
    imageAlt: 'Firma de contrato de alquiler con opción a compra',
    paraQuien: [
      'Futuros compradores que aún no tienen financiación aprobada',
      'Vendedores que quieren ingresos por alquiler mientras no se cierra la venta',
      'Familias que necesitan un período de adaptación antes de comprar',
      'Operaciones donde se quiere asegurar el precio de compra futuro hoy',
    ],
    incluye: [
      'Contrato de arrendamiento + derecho de opción integrados',
      'Precio de compra fijado y plazo máximo para ejercitar la opción',
      'Descuento de rentas en el precio final de compra',
      'Prima de opción (señal) y condiciones de devolución',
      'Penalización por no ejercitar la opción en plazo',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita datos de comprador, vendedor, inmueble, renta mensual, precio de compra y plazo de la opción.' },
      { num: '02', titulo: 'Revisión jurídica completa', desc: 'Nuestros abogados verifican la nota simple, redactan el doble contrato y calculan el descuento de rentas sobre el precio final.' },
      { num: '03', titulo: 'Entrega en 48h', desc: 'Recibes el PDF con los dos contratos integrados (arrendamiento + opción), listo para firma digital de ambas partes.' },
    ],
    faq: [
      {
        q: '¿Puedo deducirme el alquiler del precio de compra?',
        a: 'Sí, es una de las ventajas clave. El contrato puede establecer que el 100 % o un porcentaje pactado de cada mensualidad se descuente del precio final de compra. Nuestro contrato especifica exactamente la fórmula de descuento.',
      },
      {
        q: '¿Qué pasa si decido no comprar al final?',
        a: 'Pierdes la prima de opción (señal inicial pactada) pero no las rentas de alquiler. El arrendamiento continúa o finaliza según los términos del contrato. El vendedor recupera la plena disposición del inmueble.',
      },
      {
        q: '¿El precio de compra puede cambiar durante el período de alquiler?',
        a: 'No. Una vez firmado, el precio de compra queda fijado e inalterable. Esa certeza sobre el precio futuro es precisamente el valor de la opción de compra.',
      },
      {
        q: '¿Necesito notario para ejercitar la opción de compra?',
        a: 'Cuando llega el momento de comprar, sí es necesaria escritura notarial de compraventa, como en cualquier transmisión inmobiliaria. La opción en sí se ejerce mediante comunicación fehaciente al vendedor dentro del plazo pactado.',
      },
    ],
    relacionados: [
      { slug: 'arras-penitenciales', nombre: 'Arras Penitenciales', precio: 120 },
      { slug: 'arras-confirmatorias', nombre: 'Arras Confirmatorias', precio: 120 },
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
    ],
  },

  'prestamo-particulares': {
    nombre: 'Contrato de Préstamo entre Particulares',
    precio: 90,
    categoria: 'Financiación',
    tagline: 'Formaliza el préstamo de capital privado con plena validez jurídica y fiscal',
    descripcion:
      'Un préstamo entre particulares —sea entre familiares, amigos o socios— sin contrato escrito puede convertirse en una fuente de conflictos devastadores: reclamaciones por incumplimiento sin pruebas, obligaciones fiscales incumplidas (Hacienda puede considerar el dinero como una donación encubierta sujeta al Impuesto de Donaciones), o disputas sobre intereses y plazos de devolución. Nuestro contrato regula el importe, los plazos, los intereses pactados y las consecuencias del impago, con plena validez ante juzgados y ante la Agencia Tributaria.',
    image: '/gestoria/gestoria3.jpg',
    imageAlt: 'Firma de contrato de préstamo entre particulares',
    paraQuien: [
      'Familiares o amigos que prestan o reciben dinero de forma privada',
      'Inversores privados que financian proyectos o negocios',
      'Préstamos para compra o reforma de inmueble entre conocidos',
      'Comunidades de propietarios que necesitan financiación temporal',
    ],
    incluye: [
      'Importe, plazos de devolución y cuotas detalladas',
      'Tipo de interés remuneratorio o préstamo sin interés (0 %)',
      'Cláusulas de vencimiento anticipado por impago',
      'Garantías opcionales (aval personal, hipoteca, prenda)',
      'Nota fiscal: tributación correcta ante la AEAT incluida',
      'Entrega en PDF firmable digitalmente en 48h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita los datos del prestamista, prestatario, importe, plazo e interés pactado. El formulario es guiado y confidencial.' },
      { num: '02', titulo: 'Redacción y revisión fiscal', desc: 'Nuestros abogados redactan el contrato y verifican que el tratamiento fiscal sea correcto para ambas partes ante Hacienda.' },
      { num: '03', titulo: 'Entrega en 48h', desc: 'Recibes el PDF con el contrato de préstamo, instrucciones de firma y nota fiscal con las obligaciones tributarias.' },
    ],
    faq: [
      {
        q: '¿Un préstamo entre familiares tiene que tributar?',
        a: 'Sí. Hacienda puede considerarlo una donación encubierta y liquidar el Impuesto de Donaciones si no existe contrato escrito. Con nuestro contrato, el préstamo tributa correctamente por el Impuesto de Transmisiones Patrimoniales (cuota cero si es sin interés) y queda documentado para cualquier comprobación.',
      },
      {
        q: '¿Puede ser un préstamo sin intereses?',
        a: 'Sí, un préstamo a tipo 0 % es perfectamente válido jurídicamente. Hay que declararlo igualmente en la AEAT, pero no genera cuota a pagar. Nuestro contrato lo regula correctamente para que Hacienda no lo cuestione.',
      },
      {
        q: '¿Qué pasa si el prestatario no devuelve el dinero?',
        a: 'Con el contrato firmado tienes título ejecutivo para reclamar judicialmente. Puedes iniciar un procedimiento monitorio y, si no hay oposición, obtener embargo de bienes. Sin contrato escrito la reclamación es mucho más compleja.',
      },
      {
        q: '¿Puedo incluir garantías adicionales como hipoteca o aval?',
        a: 'Sí. El contrato puede incluir garantías personales (aval de un tercero), garantías reales (prenda sobre bienes muebles) o incluso hipoteca sobre inmueble si las partes lo acuerdan. Te informamos de la mejor opción según el importe.',
      },
    ],
    relacionados: [
      { slug: 'arras-penitenciales', nombre: 'Arras Penitenciales', precio: 120 },
      { slug: 'alquiler-opcion-compra', nombre: 'Alquiler con Opción a Compra', precio: 150 },
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
    ],
  },

  'alquiler-garaje-trastero': {
    nombre: 'Contrato de Alquiler de Garaje o Trastero',
    precio: 40,
    categoria: 'Alquiler',
    tagline: 'El contrato más ágil y económico para alquilar tu plaza de garaje o trastero',
    descripcion:
      'El alquiler de garajes y trasteros está excluido del régimen de la LAU en sus aspectos de vivienda habitual, lo que significa que las partes tienen total libertad de pactos pero también más exposición a conflictos si no hay contrato escrito: uso del espacio, vehículos permitidos, responsabilidad por daños o robos, duración mínima y devolución de la fianza. Nuestro contrato es sencillo, económico y cubre todos los puntos que habitualmente generan disputas entre propietario e inquilino.',
    image: '/gestoria/gestoria5.jpg',
    imageAlt: 'Contrato de alquiler de plaza de garaje o trastero',
    paraQuien: [
      'Propietarios de plazas de garaje que quieren alquilarlas',
      'Propietarios de trasteros o almacenes de uso privado',
      'Comunidades de propietarios con espacios sin uso',
      'Inquilinos que quieren garantías de uso exclusivo y devolución de fianza',
    ],
    incluye: [
      'Descripción del espacio y vehículos u objetos permitidos',
      'Duración, prórrogas y condiciones de salida anticipada',
      'Fianza y procedimiento detallado de devolución',
      'Responsabilidad por daños, robos y siniestros',
      'Normas de acceso y uso del espacio común del garaje',
      'Entrega en PDF firmable digitalmente en 24h',
    ],
    pasos: [
      { num: '01', titulo: 'Solicita el contrato', desc: 'Facilita los datos del propietario, arrendatario, ubicación de la plaza o trastero y renta mensual. Solo 3 minutos.' },
      { num: '02', titulo: 'Redacción en 24h', desc: 'Por la sencillez del contrato, nuestro equipo lo entrega en 24h. Incluye fianza, normas de uso y responsabilidad.' },
      { num: '03', titulo: 'Firma digital', desc: 'Ambas partes firman el PDF digitalmente. Queda registro electrónico de la fecha y voluntad de las partes.' },
    ],
    faq: [
      {
        q: '¿Qué pasa si alguien daña mi vehículo en el garaje?',
        a: 'Depende del tipo de garaje y del contrato de arrendamiento. Nuestro contrato incluye una cláusula de responsabilidad que especifica qué daños cubre el arrendador y cuáles son responsabilidad del arrendatario o del seguro correspondiente.',
      },
      {
        q: '¿Es obligatorio pedir fianza por un garaje?',
        a: 'No es obligatorio legalmente, pero es muy recomendable. Lo habitual es una mensualidad de renta. Nuestro contrato incluye la cláusula de fianza con plazo máximo de devolución.',
      },
      {
        q: '¿Puedo alquilar una plaza de garaje que no tiene escritura propia?',
        a: 'Sí. Muchas plazas son parte indivisible del inmueble principal. En ese caso, el contrato regula el derecho de uso de la plaza sin necesidad de que tenga referencia catastral independiente.',
      },
      {
        q: '¿Qué ocurre si el inquilino del garaje no paga?',
        a: 'Con contrato escrito puedes iniciar un procedimiento de desahucio o monitorio. Sin contrato, la reclamación es mucho más difícil. Por eso, incluso para importes pequeños, siempre recomendamos firmar.',
      },
    ],
    relacionados: [
      { slug: 'contrato-alquiler', nombre: 'Contrato de Alquiler LAU', precio: 90 },
      { slug: 'alquiler-habitaciones', nombre: 'Alquiler de Habitación', precio: 100 },
      { slug: 'rescision-alquiler', nombre: 'Rescisión de Alquiler', precio: 60 },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(SERVICIOS).map((servicio) => ({ servicio }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ servicio: string }>
}): Promise<Metadata> {
  const { servicio } = await params
  const data = SERVICIOS[servicio]
  if (!data) return {}
  return {
    title: `${data.nombre} — Gestoría inmobiliaria`,
    description: `${data.tagline}. Redactado por abogados especializados. Desde ${data.precio} €. Entrega en 48h.`,
    alternates: { canonical: `${BASE_URL}/gestoria/${servicio}` },
    openGraph: {
      title: `${data.nombre} | Inmonest Gestoría`,
      description: `${data.tagline}. ${data.precio} € · Entrega en 48h.`,
      url: `${BASE_URL}/gestoria/${servicio}`,
      type: 'website',
      siteName: 'Inmonest',
      locale: 'es_ES',
    },
  }
}

export default async function ServicioGestoriaPage({
  params,
}: {
  params: Promise<{ servicio: string }>
}) {
  const { servicio } = await params
  const data = SERVICIOS[servicio]
  if (!data) notFound()

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.nombre,
    description: data.tagline,
    url: `${BASE_URL}/gestoria/${servicio}`,
    provider: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    areaServed: { '@type': 'Country', name: 'España' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: String(data.precio),
    },
  })

  const faqSchemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  })

  const breadcrumbJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Gestoría', item: `${BASE_URL}/gestoria` },
      { '@type': 'ListItem', position: 3, name: data.nombre, item: `${BASE_URL}/gestoria/${servicio}` },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchemaJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJson }} />

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[400px] sm:h-[480px] overflow-hidden">
        <Image
          src={data.image}
          alt={data.imageAlt}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3d2a05]/90 via-[#7a5c1e]/70 to-transparent" />

        <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-white/80 transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/gestoria" className="hover:text-white/80 transition-colors">Gestoría</Link>
            <span>/</span>
            <span className="text-white/80">{data.nombre}</span>
          </nav>

          <span className="inline-block bg-[#c9a84c] text-[#3d2a05] text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
            {data.categoria}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 max-w-2xl">
            {data.nombre}
          </h1>
          <p className="text-white/80 text-lg max-w-xl mb-5">{data.tagline}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-3xl font-bold text-[#c9a84c]">{data.precio} €</span>
            <span className="text-white/60 text-sm">· Entrega en 48h · PDF firmable</span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── DESCRIPCIÓN + CTA ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">¿Qué es el {data.nombre.toLowerCase()}?</h2>
            <p className="text-gray-600 leading-relaxed text-[1.05rem]">{data.descripcion}</p>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">¿Para quién es este contrato?</h3>
              <ul className="space-y-2">
                {data.paraQuien.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-[#c9a84c] mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tarjeta CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#fdf8ee] border border-[#e8d48a] rounded-2xl p-6 space-y-4">
              <p className="text-sm text-[#7a5c1e] font-medium uppercase tracking-wide">{data.categoria}</p>
              <h3 className="text-xl font-bold text-gray-900">{data.nombre}</h3>
              <p className="text-4xl font-bold text-[#c9a84c]">{data.precio} €</p>
              <ul className="space-y-2">
                {data.incluye.slice(0, 4).map((inc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-[#c9a84c] mt-0.5 shrink-0">✓</span>
                    {inc}
                  </li>
                ))}
              </ul>
              <Link
                href="/publicar-anuncio"
                className="block w-full text-center bg-[#c9a84c] hover:bg-[#b8943a] text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Solicitar ahora
              </Link>
              <Link
                href="/gestoria"
                className="block w-full text-center border border-[#c9a84c] text-[#c9a84c] hover:bg-[#fdf8ee] font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Ver todos los contratos
              </Link>
            </div>
          </div>
        </section>

        {/* ── QUÉ INCLUYE ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué incluye el servicio?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.incluye.map((inc, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <span className="text-[#c9a84c] text-lg mt-0.5 shrink-0">✓</span>
                <span className="text-gray-700 text-sm">{inc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cómo funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {data.pasos.map((paso) => (
              <div key={paso.num} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <span className="text-5xl font-black text-[#c9a84c]/20 absolute top-4 right-5 leading-none">
                  {paso.num}
                </span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{paso.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── IMAGEN INTERMEDIA ────────────────────────────────────────── */}
        <section className="relative h-52 rounded-2xl overflow-hidden">
          <Image
            src="/gestoria1.jpg"
            alt="Equipo de abogados inmobiliarios Inmonest"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-[#3d2a05]/70 flex flex-col items-center justify-center text-center px-6">
            <p className="text-white text-xl font-bold mb-2">Redactado por abogados especializados</p>
            <p className="text-white/70 text-sm">Sin plantillas genéricas. Cada contrato se adapta a tu operación real.</p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {data.faq.map((item, i) => (
              <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                  {item.q}
                  <span className="text-[#c9a84c] shrink-0 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── CONTRATOS RELACIONADOS ───────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Otros contratos que pueden interesarte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.relacionados.map((rel) => (
              <Link
                key={rel.slug}
                href={`/gestoria/${rel.slug}`}
                className="border border-gray-200 rounded-xl p-5 hover:border-[#c9a84c] hover:shadow-sm transition-all group"
              >
                <p className="text-sm text-gray-500 mb-1">Contrato</p>
                <h3 className="font-semibold text-gray-800 group-hover:text-[#c9a84c] transition-colors mb-2">
                  {rel.nombre}
                </h3>
                <p className="text-[#c9a84c] font-bold">{rel.precio} €</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────────────────── */}
        <section className="bg-[#0d1a0f] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">¿Listo para solicitar tu {data.nombre.toLowerCase()}?</h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            En menos de 48h tienes el documento listo para firmar. Redactado por abogados, sin plantillas genéricas.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/publicar-anuncio"
              className="bg-[#c9a84c] hover:bg-[#b8943a] text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Solicitar {data.nombre} — {data.precio} €
            </Link>
            <Link
              href="/gestoria"
              className="border border-white/20 text-white hover:bg-white/10 font-medium py-3 px-8 rounded-xl transition-colors"
            >
              Ver todos los contratos
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
