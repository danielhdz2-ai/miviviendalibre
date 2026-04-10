'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SolicitarModal from './SolicitarModal'

interface Service {
  key: string
  name: string
  shortName: string
  category: 'compraventa' | 'alquiler' | 'rescision'
  description: string
  includes: string[]
  price: number
  image: string
  badge?: string
}

const SERVICES: Service[] = [
  // --- COMPRAVENTA ---
  {
    key: 'arras-penitenciales',
    name: 'Contrato de Arras Penitenciales',
    shortName: 'Arras Penitenciales',
    category: 'compraventa',
    description: 'El estándar de oro en compraventa. Permite al comprador desistir perdiendo la señal, o al vendedor devolviéndola doblada. Máxima seguridad jurídica para ambas partes.',
    includes: [
      'Redacción personalizada según partes',
      'Cláusulas de desistimiento y penalización',
      'Revisión datos registrales y nota simple',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 120,
    image: '/gestoria/gestoria1.jpg',
    badge: 'Más solicitado',
  },
  {
    key: 'arras-confirmatorias',
    name: 'Contrato de Arras Confirmatorias',
    shortName: 'Arras Confirmatorias',
    category: 'compraventa',
    description: 'El contrato más vinculante. Obliga a ambas partes al cumplimiento de la compraventa. Ideal cuando comprador y vendedor tienen total certeza de la operación.',
    includes: [
      'Redacción personalizada según partes',
      'Obligación de cumplimiento para ambas partes',
      'Cláusulas de incumplimiento y resolución',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 120,
    image: '/gestoria/gestoria3.jpg',
  },
  {
    key: 'reserva-compra',
    name: 'Contrato de Reserva de Compra',
    shortName: 'Reserva de Compra',
    category: 'compraventa',
    description: 'Un documento rápido y efectivo para retirar el piso del mercado durante 48-72h mientras se revisa la nota simple y se prepara el contrato definitivo.',
    includes: [
      'Bloqueo jurídico del inmueble 48-72h',
      'Consignación de señal de reserva',
      'Condiciones resolutorias incluidas',
      'Entrega en 24h · PDF firmable digitalmente',
    ],
    price: 50,
    image: '/gestoria/gestoria4.jpg',
  },

  // --- ALQUILER ---
  {
    key: 'alquiler-vivienda-lau',
    name: 'Contrato de Alquiler de Vivienda (LAU)',
    shortName: 'Alquiler LAU',
    category: 'alquiler',
    description: 'El contrato de larga estancia actualizado a la Ley de Vivienda 2026. Regula derechos y obligaciones con todas las garantías legales vigentes para propietario e inquilino.',
    includes: [
      'Adaptado a la Ley de Vivienda 2026',
      'Fianza y garantías adicionales incluidas',
      'Cláusulas de actualización de renta (IPC)',
      'Inventario de mobiliario annexo',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 90,
    image: '/gestoria/gestoria7.jpg',
    badge: 'Ley 2026',
  },
  {
    key: 'alquiler-temporada',
    name: 'Contrato de Alquiler por Temporada',
    shortName: 'Alquiler Temporada',
    category: 'alquiler',
    description: 'Para nómadas digitales, estudiantes o uso distinto al de vivienda habitual. Evita las prórrogas forzosas de la LAU. Muy demandado por propietarios que quieren flexibilidad.',
    includes: [
      'Duración y causa de temporalidad específica',
      'Exento de prórrogas automáticas de la LAU',
      'Compatible con plataformas tipo Airbnb larga estancia',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 80,
    image: '/gestoria/gestoria2.jpg',
  },
  {
    key: 'alquiler-habitacion',
    name: 'Contrato de Alquiler de Habitación',
    shortName: 'Alquiler Habitación',
    category: 'alquiler',
    description: 'Ideal para coliving o pisos compartidos. Regula el alquiler de una habitación dentro de una vivienda, con acceso a zonas comunes y normas de convivencia.',
    includes: [
      'Regulación de uso de zonas comunes',
      'Normas de convivencia y uso del inmueble',
      'Fianza y condiciones de salida',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 60,
    image: '/gestoria/gestoria6.jpg',
  },
  {
    key: 'reserva-alquiler',
    name: 'Contrato de Reserva de Alquiler',
    shortName: 'Reserva de Alquiler',
    category: 'alquiler',
    description: 'Asegura al inquilino antes de la firma del contrato definitivo. El propietario retira el anuncio y el inquilino se compromete con una señal previa.',
    includes: [
      'Señal de reserva y condiciones de devolución',
      'Plazo máximo para firma del contrato definitivo',
      'Cláusulas de desistimiento de ambas partes',
      'Entrega en 24h · PDF firmable digitalmente',
    ],
    price: 50,
    image: '/gestoria/gestoria5.jpg',
  },

  // --- RESCISIÓN Y FIANZAS ---
  {
    key: 'rescision-alquiler',
    name: 'Contrato de Rescisión de Alquiler',
    shortName: 'Rescisión de Alquiler',
    category: 'rescision',
    description: 'Documenta la entrega de llaves y el estado del piso al finalizar el contrato. Imprescindible para que el propietario no tenga problemas posteriores con reclamaciones.',
    includes: [
      'Acta de estado del inmueble en la entrega',
      'Acuerdo de liquidación de fianza',
      'Renuncia mutua a reclamaciones futuras',
      'Entrega en 48h · PDF firmable digitalmente',
    ],
    price: 60,
    image: '/gestoria/gestoria3.jpg',
  },
  {
    key: 'liquidacion-fianza',
    name: 'Documento de Liquidación de Fianza',
    shortName: 'Liquidación de Fianza',
    category: 'rescision',
    description: 'Desglose detallado de qué se devuelve y qué se descuenta de la fianza por limpieza, daños o suministros pendientes. Evita conflictos y protege al propietario.',
    includes: [
      'Desglose de conceptos descontados',
      'Valoración de daños con criterios objetivos',
      'Importes a devolver y plazos',
      'Entrega en 24h · PDF firmable digitalmente',
    ],
    price: 30,
    image: '/gestoria/gestoria2.jpg',
  },
  {
    key: 'devolucion-fianzas',
    name: 'Solicitud de Devolución de Fianzas',
    shortName: 'Devolución de Fianzas',
    category: 'rescision',
    description: 'Kit completo para recuperar la fianza depositada en el organismo público correspondiente (Incasol, IVIMA, etc.) según tu comunidad autónoma. Paso a paso.',
    includes: [
      'Formulario oficial rellenado por nuestra gestoría',
      'Instrucciones adaptadas a tu CCAA',
      'Seguimiento del trámite incluido',
      'Entrega en 48h · PDF y formularios',
    ],
    price: 40,
    image: '/gestoria/gestoria6.jpg',
  },
]

const CATEGORIES = [
  { key: 'all', label: 'Todos los servicios' },
  { key: 'compraventa', label: 'Compraventa' },
  { key: 'alquiler', label: 'Alquiler' },
  { key: 'rescision', label: 'Rescisión y fianzas' },
]

const CATEGORY_COLORS: Record<string, string> = {
  compraventa: 'bg-orange-100 text-orange-700',
  alquiler: 'bg-purple-100 text-purple-700',
  rescision: 'bg-blue-100 text-blue-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  compraventa: 'Compraventa',
  alquiler: 'Alquiler',
  rescision: 'Rescisión',
}

export default function GestoriaPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const filtered = activeCategory === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeCategory)

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative h-[480px] sm:h-[560px] overflow-hidden">
        <Image
          src="/gestoria/imagencabezera.jpg"
          alt="Equipo de gestoría inmobiliaria"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3d2a05]/90 via-[#7a5c1e]/70 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-4xl">
          <span className="inline-block bg-[#c9962a] text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 w-fit">
            Gestoría Inmobiliaria
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Contratos inmobiliarios<br />
            <span className="text-[#f4c94a]">redactados por expertos</span>
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-xl leading-relaxed">
            Nuestro equipo de abogados especializados en derecho inmobiliario redacta cada contrato a medida. Sin automatismos. Con la seguridad jurídica que mereces.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm">
              <span>⚖️</span> Abogados especializados
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm">
              <span>⏱️</span> Respuesta en 24h
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm">
              <span>📜</span> +500 contratos redactados
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-[#7a5c1e] py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
          {[
            { icon: '🏛️', text: 'Equipo de abogados colegiados' },
            { icon: '📋', text: 'Contratos personalizados, no plantillas' },
            { icon: '🔒', text: 'Sin pago por adelantado' },
            { icon: '📧', text: 'Entrega por email en PDF firmable' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-white/90 text-sm font-medium">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Nuestros servicios</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Desde 30 € hasta 120 €. Cada contrato redactado a mano por nuestros gestores, adaptado a tu situación concreta.
          </p>
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-[#c9962a] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => (
            <article
              key={service.key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <Image
                  src={service.image}
                  alt={service.shortName}
                  fill
                  className="object-cover"
                />
                {/* Overlay degradado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {/* Badge categoría */}
                <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[service.category]}`}>
                  {CATEGORY_LABELS[service.category]}
                </span>
                {/* Badge especial */}
                {service.badge && (
                  <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-[#c9962a] text-white">
                    {service.badge}
                  </span>
                )}
                {/* Precio en imagen */}
                <div className="absolute bottom-3 right-3 bg-white/95 rounded-lg px-3 py-1.5">
                  <span className="text-xl font-extrabold text-[#c9962a]">{service.price} €</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">
                  {service.description}
                </p>

                {/* Lo que incluye */}
                <ul className="space-y-1.5 mb-5">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-[#c9962a] mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => setSelectedService(service)}
                  className="w-full py-2.5 bg-[#c9962a] text-white rounded-xl font-bold text-sm hover:bg-[#a87a20] transition-colors"
                >
                  Solicitar por {service.price} €
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-[#fef9e8] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Solicitas el servicio',
                desc: 'Rellenas el formulario con tus datos y el contrato que necesitas. Sin necesidad de cuenta ni pago previo.',
                icon: '📝',
              },
              {
                step: '02',
                title: 'Te contactamos en 24h',
                desc: 'Un gestor del equipo se pone en contacto contigo por email o teléfono para entender tu situación y confirmar los detalles.',
                icon: '📞',
              },
              {
                step: '03',
                title: 'Recibes tu contrato',
                desc: 'En 48h recibes el contrato en PDF, personalizado con los datos reales de las partes y listo para firmar.',
                icon: '✅',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[#c9962a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-2">Paso {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO / GARANTÍAS */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#c9962a] uppercase tracking-widest">Nuestro equipo</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-2 mb-4">
                Abogados especializados en<br />derecho inmobiliario español
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                No generamos documentos automáticos. Cada contrato lo revisa un abogado colegiado con experiencia en operaciones inmobiliarias, adaptándolo a la normativa autonómica específica de cada comunidad.
              </p>
              <ul className="space-y-3">
                {[
                  'Experiencia en LAU, LGCU y Ley de Vivienda 2026',
                  'Conocimiento de normativa autonómica (Catalunya, Madrid, Valencia...)',
                  'Revisión jurídica de cada contrato antes de entrega',
                  'Disponibles para consultas post-entrega incluidas',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-[#fef0c0] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[#c9962a] font-bold text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '+500', label: 'Contratos redactados', icon: '📋' },
                { num: '48h', label: 'Tiempo medio de entrega', icon: '⚡' },
                { num: '98%', label: 'Clientes satisfechos', icon: '⭐' },
                { num: '17', label: 'CCAA cubiertas', icon: '🗺️' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#fef9e8] rounded-2xl p-5 text-center border border-[#f4c94a]/30">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-extrabold text-[#c9962a]">{stat.num}</div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              {
                q: '¿Necesito tener cuenta en MiviviendaLibre para contratar?',
                a: 'No. Puedes solicitar cualquier servicio sin tener cuenta. Solo necesitas un email de contacto donde te enviaremos el contrato.',
              },
              {
                q: '¿Cuándo pago?',
                a: 'No hay pago por adelantado. Nuestro gestor te contacta en 24h, te confirma los detalles y te indica cómo proceder al pago antes de la entrega del documento.',
              },
              {
                q: '¿Los contratos tienen validez legal en toda España?',
                a: 'Sí. Nuestros contratos siguen la legislación estatal vigente (LAU, Código Civil, Ley de Vivienda 2026) y se adaptan a las particularidades de cada comunidad autónoma cuando es necesario.',
              },
              {
                q: '¿Qué pasa si necesito modificaciones después de recibirlo?',
                a: 'Incluimos una ronda de revisiones gratuita. Si una vez revisado el contrato necesitas algún ajuste, tu gestor lo realiza sin coste adicional dentro de los 7 días posteriores a la entrega.',
              },
              {
                q: '¿Puedo solicitar un contrato que no aparece en la lista?',
                a: 'Sí. Contáctanos directamente desde el formulario de cualquier servicio, explícanos qué necesitas en el campo de notas y te daremos presupuesto personalizado.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-gray-100 group">
                <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer font-semibold text-gray-900 text-sm list-none">
                  {q}
                  <svg className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-r from-[#7a5c1e] to-[#c9962a] py-14 px-4">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">¿Listo para proteger tu operación?</h2>
          <p className="text-white/80 mb-6 text-base">
            Desde 30 €. Sin letra pequeña. Sin plantillas genéricas. Con la firma de un profesional.
          </p>
          <button
            onClick={() => setSelectedService(SERVICES[0])}
            className="inline-block px-8 py-3.5 bg-white text-[#c9962a] rounded-full font-bold text-sm hover:bg-[#fef9e8] transition-colors shadow-lg"
          >
            Ver todos los contratos
          </button>
        </div>
      </section>

      {/* Modal solicitud */}
      {selectedService && (
        <SolicitarModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}
