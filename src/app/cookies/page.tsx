import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'

export const metadata: Metadata = {
  title: 'Política de Cookies — Inmonest',
  description: 'Información sobre las cookies que utiliza Inmonest, su finalidad y cómo gestionarlas.',
}

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-700">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: abril de 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. ¿Qué son las cookies?</h2>
          <p className="leading-relaxed">
            Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Se utilizan ampliamente para que los sitios web funcionen correctamente, para mejorar la experiencia del usuario y para proporcionar información analítica a los propietarios del sitio.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Cookies que utilizamos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Nombre</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Finalidad</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">sb-*</td>
                  <td className="px-4 py-2">Técnica / Sesión</td>
                  <td className="px-4 py-2">Gestión de sesión de usuario (Supabase Auth)</td>
                  <td className="px-4 py-2">Sesión / 7 días</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">_ga, _gid</td>
                  <td className="px-4 py-2">Analítica</td>
                  <td className="px-4 py-2">Estadísticas de uso anónimas (Google Analytics vía GTM)</td>
                  <td className="px-4 py-2">2 años / 24h</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">_gtm_*</td>
                  <td className="px-4 py-2">Analítica</td>
                  <td className="px-4 py-2">Google Tag Manager — gestión de etiquetas</td>
                  <td className="px-4 py-2">Sesión</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">stripe-mid</td>
                  <td className="px-4 py-2">Técnica</td>
                  <td className="px-4 py-2">Prevención de fraude en pagos (Stripe)</td>
                  <td className="px-4 py-2">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Clasificación de las cookies</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Cookies técnicas (necesarias)</h3>
              <p className="text-sm leading-relaxed">Son imprescindibles para el funcionamiento del sitio web. Permiten, entre otras cosas, que el usuario se autentique y navegue de forma segura. No requieren consentimiento previo del usuario.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Cookies analíticas</h3>
              <p className="text-sm leading-relaxed">Nos permiten conocer cómo interactúan los usuarios con el sitio (páginas visitadas, tiempo de permanencia, origen del tráfico, etc.) con el fin de mejorar el servicio. Requieren tu consentimiento.</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cómo gestionar o desactivar las cookies</h2>
          <p className="leading-relaxed mb-3">
            Puedes controlar y/o eliminar las cookies según desees. Puedes eliminar todas las cookies que ya están en tu dispositivo y configurar la mayoría de los navegadores para que no las instalen. Sin embargo, si lo haces, es posible que tengas que ajustar manualmente algunas preferencias cada vez que visites el sitio.
          </p>
          <p className="text-sm leading-relaxed">Instrucciones para los principales navegadores:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#c9962a] hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[#c9962a] hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#c9962a] hover:underline">Safari</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#c9962a] hover:underline">Microsoft Edge</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Más información</h2>
          <p className="leading-relaxed">
            Si tienes alguna pregunta sobre nuestra Política de Cookies, escríbenos a <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a>.
          </p>
        </section>
      </main>
    </>
  )
}
