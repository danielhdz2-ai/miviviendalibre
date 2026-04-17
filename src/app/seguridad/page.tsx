import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'

export const metadata: Metadata = {
  title: 'Seguridad — Inmonest',
  description: 'Cómo Inmonest protege tus datos y tu cuenta. Medidas de seguridad, buenas prácticas y cómo reportar vulnerabilidades.',
}

export default function SeguridadPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-700">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Seguridad</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: abril de 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Nuestro compromiso con tu seguridad</h2>
          <p className="leading-relaxed">
            En Inmonest la seguridad de tus datos y de tu cuenta es una prioridad. Aplicamos medidas técnicas y organizativas adecuadas para proteger la información personal frente al acceso no autorizado, la pérdida accidental, la divulgación o la alteración.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Medidas técnicas de seguridad</h2>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li><strong>Cifrado en tránsito:</strong> toda la comunicación entre tu navegador y nuestros servidores se realiza mediante TLS 1.3 (HTTPS).</li>
            <li><strong>Cifrado en reposo:</strong> las contraseñas se almacenan con hash bcrypt; los datos sensibles se cifran en la base de datos.</li>
            <li><strong>Autenticación segura:</strong> usamos Supabase Auth con tokens JWT de corta duración y refresh tokens rotativos.</li>
            <li><strong>Pagos certificados PCI DSS:</strong> los pagos son procesados por Stripe (PCI DSS Nivel 1). Inmonest nunca almacena datos de tarjeta.</li>
            <li><strong>Control de acceso basado en roles (RLS):</strong> las políticas de Row Level Security en Supabase garantizan que cada usuario solo accede a sus propios datos.</li>
            <li><strong>Actualizaciones regulares:</strong> mantenemos nuestras dependencias y librerías actualizadas para mitigar vulnerabilidades conocidas.</li>
            <li><strong>Auditoría de accesos:</strong> registramos los accesos a datos sensibles para detectar comportamientos anómalos.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Buenas prácticas para proteger tu cuenta</h2>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li>Usa una contraseña única y robusta (mínimo 12 caracteres, combinando letras, números y símbolos).</li>
            <li>No compartas tu contraseña con nadie, ni siquiera con el equipo de Inmonest — nunca te la pediremos.</li>
            <li>Cierra siempre tu sesión al usar un dispositivo compartido o público.</li>
            <li>Mantén actualizado el sistema operativo y el navegador que usas para acceder a Inmonest.</li>
            <li>Si recibes un correo sospechoso en nombre de Inmonest, no hagas clic en ningún enlace y repórtanoslo.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Phishing y fraude</h2>
          <p className="leading-relaxed">
            Inmonest <strong>nunca</strong> te pedirá tu contraseña por correo electrónico, teléfono o chat. Todos los correos oficiales provienen del dominio <strong>@inmonest.com</strong>. Si detectas algún intento de suplantación, repórtalo inmediatamente a <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline">info@inmonest.com</a>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Divulgación responsable de vulnerabilidades</h2>
          <p className="leading-relaxed">
            Si has descubierto una vulnerabilidad de seguridad en Inmonest, te pedimos que nos lo comuniques de forma responsable antes de hacer pública la información, dándonos tiempo razonable para corregirla. Puedes reportar vulnerabilidades en:
          </p>
          <p className="mt-3">
            <a href="mailto:info@inmonest.com" className="text-[#c9962a] hover:underline font-semibold">info@inmonest.com</a>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Por favor, incluye en tu reporte: descripción del problema, pasos para reproducirlo, posible impacto y, si es posible, una sugerencia de corrección. Nos comprometemos a responder en un plazo máximo de 72 horas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Incidentes de seguridad</h2>
          <p className="leading-relaxed">
            En caso de que se produzca una brecha de seguridad que afecte a tus datos personales, Inmonest notificará a la Agencia Española de Protección de Datos (AEPD) en el plazo de 72 horas desde su detección, y te informará directamente si dicha brecha supone un riesgo elevado para tus derechos y libertades.
          </p>
        </section>
      </main>
    </>
  )
}
