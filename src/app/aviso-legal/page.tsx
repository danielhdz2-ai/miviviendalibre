import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'

export const metadata: Metadata = {
  title: 'Aviso Legal — Inmonest',
  description: 'Aviso legal de Inmonest. Información sobre el titular del sitio web, condiciones de uso y responsabilidad.',
}

export default function AvisoLegalPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-700">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Aviso Legal</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: abril de 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Datos identificativos del titular</h2>
          <p className="leading-relaxed">
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se informa de los datos del titular de este sitio web:
          </p>
          <ul className="mt-4 space-y-1 text-sm">
            <li><strong>Denominación social:</strong> Inmonest</li>
            <li><strong>Nombre comercial:</strong> Inmonest</li>
            <li><strong>Correo electrónico:</strong> <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a></li>
            <li><strong>Sitio web:</strong> <a href="https://inmonest.com" className="text-[#c9962a] hover:underline">https://inmonest.com</a></li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Objeto y ámbito de aplicación</h2>
          <p className="leading-relaxed">
            El presente Aviso Legal regula el acceso y uso del sitio web <strong>inmonest.com</strong> (en adelante, «el Sitio»), cuya titularidad corresponde a Inmonest. El acceso y navegación por el Sitio implica la aceptación plena y sin reservas de todas las disposiciones recogidas en este Aviso Legal.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Condiciones de uso</h2>
          <p className="leading-relaxed">
            El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que Inmonest ofrece, y a no emplearlos para realizar actividades ilícitas, contrarias a la buena fe y al orden público, o que pudieran lesionar derechos e intereses de terceros. Queda prohibida la reproducción, distribución o comunicación pública de los contenidos del Sitio sin autorización expresa del titular.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Propiedad intelectual e industrial</h2>
          <p className="leading-relaxed">
            Todos los contenidos del Sitio (textos, imágenes, logotipos, código fuente, diseño gráfico, etc.) son propiedad de Inmonest o de sus licenciantes y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda expresamente prohibida cualquier reproducción sin el consentimiento previo y por escrito del titular.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Exclusión de responsabilidad</h2>
          <p className="leading-relaxed">
            Inmonest no garantiza la disponibilidad o continuidad del funcionamiento del Sitio, ni la ausencia de errores en los contenidos. Asimismo, no se responsabiliza de los daños o perjuicios que pudieran derivarse del uso del Sitio, de los contenidos publicados por terceros o de la presencia de virus u otros elementos que pudieran causar alteraciones en los sistemas informáticos de los usuarios.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Legislación aplicable y jurisdicción</h2>
          <p className="leading-relaxed">
            El presente Aviso Legal se rige por la legislación española. Para cualquier controversia derivada del acceso o uso del Sitio, las partes se someten a los juzgados y tribunales competentes de acuerdo con la normativa vigente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contacto</h2>
          <p className="leading-relaxed">
            Para cualquier consulta relativa a este Aviso Legal, puede ponerse en contacto con nosotros en: <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a>.
          </p>
        </section>
      </main>
    </>
  )
}
