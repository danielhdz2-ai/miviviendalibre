import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Inmonest',
  description: 'Cómo Inmonest recopila, usa y protege tus datos personales de acuerdo con el RGPD y la LOPDGDD.',
}

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-700">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: abril de 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
          <ul className="space-y-1 text-sm">
            <li><strong>Denominación:</strong> Inmonest</li>
            <li><strong>Correo electrónico:</strong> <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a></li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Datos que recopilamos</h2>
          <p className="leading-relaxed mb-3">Recopilamos los siguientes datos personales en función de la acción que realices:</p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li><strong>Registro de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma cifrada).</li>
            <li><strong>Publicación de anuncio:</strong> datos del inmueble, fotografías, precio y datos de contacto que el propietario decida incluir.</li>
            <li><strong>Formularios de contacto:</strong> nombre, email, teléfono y el mensaje que nos envíes.</li>
            <li><strong>Servicios de gestoría:</strong> nombre, email, teléfono y la información necesaria para la prestación del servicio contratado.</li>
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas y tiempo de permanencia (via Google Tag Manager).</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalidad y base jurídica del tratamiento</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Finalidad</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Base jurídica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2">Gestión de la cuenta de usuario</td><td className="px-4 py-2">Ejecución de contrato</td></tr>
                <tr><td className="px-4 py-2">Publicación y gestión de anuncios</td><td className="px-4 py-2">Ejecución de contrato</td></tr>
                <tr><td className="px-4 py-2">Atención al cliente y consultas</td><td className="px-4 py-2">Interés legítimo</td></tr>
                <tr><td className="px-4 py-2">Prestación de servicios de gestoría</td><td className="px-4 py-2">Ejecución de contrato</td></tr>
                <tr><td className="px-4 py-2">Análisis estadístico de navegación</td><td className="px-4 py-2">Consentimiento</td></tr>
                <tr><td className="px-4 py-2">Comunicaciones comerciales propias</td><td className="px-4 py-2">Consentimiento</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Destinatarios y transferencias internacionales</h2>
          <p className="leading-relaxed">
            Inmonest puede compartir tus datos con los siguientes proveedores de servicios, quienes actúan como encargados del tratamiento bajo acuerdos de confidencialidad:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1 text-sm">
            <li><strong>Supabase Inc.</strong> (infraestructura de base de datos y autenticación) — servidores en la UE.</li>
            <li><strong>Vercel Inc.</strong> (alojamiento web) — servidores en la UE/EEA.</li>
            <li><strong>Stripe Inc.</strong> (procesamiento de pagos) — certificado PCI DSS Nivel 1.</li>
            <li><strong>Resend Inc.</strong> (envío de correos transaccionales).</li>
            <li><strong>Google LLC</strong> (analytics vía GTM) — acogido al marco EU-US Data Privacy Framework.</li>
          </ul>
          <p className="mt-3 leading-relaxed text-sm">No vendemos ni cedemos tus datos a terceros para fines publicitarios ajenos a Inmonest.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Plazo de conservación</h2>
          <p className="leading-relaxed">
            Conservamos tus datos mientras mantengas una cuenta activa o mientras sea necesario para la prestación del servicio contratado. Tras la cancelación de la cuenta, los datos se eliminarán en un plazo máximo de 30 días, salvo obligación legal de conservación.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Tus derechos</h2>
          <p className="leading-relaxed mb-3">De acuerdo con el RGPD y la LOPDGDD, puedes ejercer los siguientes derechos:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Acceso:</strong> obtener confirmación sobre si tratamos tus datos y acceder a ellos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos («derecho al olvido»).</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            <li><strong>Limitación:</strong> solicitar la restricción del tratamiento en determinadas circunstancias.</li>
          </ul>
          <p className="mt-3 text-sm">
            Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a>. También tienes derecho a presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#c9962a] hover:underline">Agencia Española de Protección de Datos (AEPD)</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cambios en esta política</h2>
          <p className="leading-relaxed">
            Inmonest se reserva el derecho de modificar esta Política de Privacidad para adaptarla a cambios legislativos o funcionales. Te notificaremos cualquier cambio relevante mediante un aviso destacado en el Sitio o por correo electrónico.
          </p>
        </section>
      </main>
    </>
  )
}
