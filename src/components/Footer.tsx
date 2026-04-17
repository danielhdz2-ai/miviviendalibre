import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0d1a0f] text-white">

      {/* ── Imagen de fondo con overlay ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src="/familia1.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-10"
          sizes="100vw"
          aria-hidden="true"
        />
        {/* Gradiente oscuro sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a0f]/80 via-[#0d1a0f]/90 to-[#0d1a0f]" />
      </div>

      {/* ── Separador dorado ────────────────────────────────────── */}
      <div className="relative z-10 h-[3px] bg-gradient-to-r from-transparent via-[#c9962a] to-transparent" />

      {/* ── Contenido principal ─────────────────────────────────── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#c9962a] text-white font-black text-lg tracking-tight">
              IN
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Inmonest
            </span>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            Tu portal inmobiliario de confianza. Sin comisiones, sin intermediarios.
          </p>
        </div>

        {/* ── Tres columnas ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

          {/* Columna 1 — Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/aviso-legal" className="hover:text-[#f4c94a] transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-[#f4c94a] transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#f4c94a] transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link href="/seguridad" className="hover:text-[#f4c94a] transition-colors">
                  Seguridad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2 — Servicios */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-4">
              Servicios
            </h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/pisos" className="hover:text-[#f4c94a] transition-colors">
                  Portal inmobiliario
                </Link>
              </li>
              <li>
                <Link href="/pisos?operation=rent" className="hover:text-[#f4c94a] transition-colors">
                  Alquiler
                </Link>
              </li>
              <li>
                <Link href="/pisos?operation=sale" className="hover:text-[#f4c94a] transition-colors">
                  Compra
                </Link>
              </li>
              <li>
                <Link href="/publicar-anuncio" className="hover:text-[#f4c94a] transition-colors">
                  Publicar anuncio
                </Link>
              </li>
              <li>
                <Link href="/gestoria" className="hover:text-[#f4c94a] transition-colors">
                  Contratos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3 — Contacto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-4">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <a
                  href="https://wa.me/34641008847?text=Hola%20Inmonest,%20necesito%20información"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#25d366] transition-colors group"
                >
                  {/* WhatsApp icon */}
                  <svg
                    className="w-4 h-4 shrink-0 text-white/40 group-hover:text-[#25d366] transition-colors"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.847L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.007-1.373l-.36-.214-3.723.976.999-3.62-.236-.373A9.8 9.8 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                  </svg>
                  <span>641 008 847</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@inmonest.com"
                  className="flex items-center gap-2 hover:text-[#f4c94a] transition-colors group"
                >
                  {/* Email icon */}
                  <svg
                    className="w-4 h-4 shrink-0 text-white/40 group-hover:text-[#f4c94a] transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="2,4 12,13 22,4" />
                  </svg>
                  <span>info@inmonest.com</span>
                </a>
              </li>
            </ul>

            {/* Redes sociales */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-3">
                Síguenos
              </h4>
              <div className="flex items-center gap-3">

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/inmonest"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Inmonest en Instagram"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#c9962a]/80 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/inmonest"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Inmonest en Facebook"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#1877f2]/80 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/inmonest"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Inmonest en X"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

              </div>
            </div>
          </div>

        </div>

        {/* ── Separador ───────────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>© 2026 Inmonest - Tu portal inmobiliario de confianza</span>
          <span className="hidden sm:block">Hecho con ❤ en España</span>
        </div>

      </div>
    </footer>
  )
}
