import { CheckCircle, FileText, MessageCircle, Phone } from '@/components/ui/Icons'

type Props = {
  ciudadNombre?: string
  region?: string
}

const PASOS_BASE = [
  {
    step: '01',
    title: 'Solicitas el contrato online',
    desc: 'Indicas si necesitas arras, alquiler LAU, pack vendedor o acompañamiento de compra. Sin cuenta obligatoria: rellenas el formulario y confirmamos el alcance.',
    Icon: FileText,
  },
  {
    step: '02',
    title: 'Gestor asignado en 24 h',
    desc: 'Un gestor inmobiliario real — no un chatbot — revisa tu operación, te llama o escribe por WhatsApp y confirma datos, plazos y documentación pendiente.',
    Icon: Phone,
  },
  {
    step: '03',
    title: 'Subes documentación al panel',
    desc: 'Accedes a tu área privada: DNIs, nota simple, actas de comunidad, inventario del inmueble… Todo queda trazado por hitos con tu gestor asignado.',
    Icon: MessageCircle,
  },
  {
    step: '04',
    title: 'Recibes el PDF en 48 h',
    desc: 'Contrato redactado a mano, adaptado a vuestra CCAA y listo para firmar. Revisiones incluidas en los 7 días siguientes a la entrega.',
    Icon: CheckCircle,
  },
] as const

export default function ContratosComoFuncionaSection({ ciudadNombre, region }: Props) {
  const pasos = PASOS_BASE.map((p, i) => {
    if (i !== 1 || !ciudadNombre) return p
    return {
      ...p,
      desc: `Un gestor que conoce el mercado de ${ciudadNombre}${region ? ` (${region})` : ''} revisa tu operación, te llama o escribe por WhatsApp y confirma datos, plazos y documentación pendiente.`,
    }
  })

  return (
    <section className="border-t border-gray-100 bg-cream-100 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
            Proceso transparente
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {ciudadNombre
              ? `¿Cómo funciona la gestoría en ${ciudadNombre}?`
              : '¿Cómo funciona Inmonest Gestoría?'}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {ciudadNombre
              ? `Cuatro pasos desde la solicitud hasta el contrato firmable. Mismo panel, mismos gestores y mismos plazos en ${ciudadNombre} que en el resto de España — con adaptación autonómica incluida.`
              : 'Cuatro pasos desde la solicitud hasta el contrato firmable. Sin citas presenciales, sin plantillas genéricas y con seguimiento humano en cada expediente.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500 shadow-md">
                <item.Icon className="h-7 w-7 text-white" />
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold-500">
                Paso {item.step}
              </div>
              <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
