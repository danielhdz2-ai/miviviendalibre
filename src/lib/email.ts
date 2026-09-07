/**
 * Utilidades de email compartidas — Inmonest
 * Usa Resend como proveedor. Requiere RESEND_API_KEY en variables de entorno.
 */

const RESEND_API  = 'https://api.resend.com/emails'
const FROM        = () => process.env.CONTACT_FROM_EMAIL ?? 'Inmonest <info@inmonest.com>'
const ADMIN_EMAIL = 'info@inmonest.com'

/** Ventas, gestoría, formularios de consulta → bandeja operativa completa */
export const GESTORIA_NOTIFY_EMAILS = ['info@inmonest.com', 'inmonest.admin@gmail.com'] as const

/** Contactos en anuncios de pisos / publicaciones → solo buzón general (no Gmail admin) */
export const LISTING_NOTIFY_EMAILS = ['info@inmonest.com'] as const

/** @deprecated Usar GESTORIA_NOTIFY_EMAILS — mantiene compatibilidad con admin allowlist */
export const NOTIFY_EMAILS = GESTORIA_NOTIFY_EMAILS

export function getGestoriaNotifyEmails(): string[] {
  return [...GESTORIA_NOTIFY_EMAILS]
}

export function getListingNotifyEmails(): string[] {
  return [...LISTING_NOTIFY_EMAILS]
}

/** Ventas y gestoría (alias histórico) */
export function getNotifyEmails(): string[] {
  return getGestoriaNotifyEmails()
}

export { ADMIN_EMAIL }

// ── Helper de envío ────────────────────────────────────────────────────────

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  reply_to?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM(),
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.reply_to ? { reply_to: payload.reply_to } : {}),
      }),
    })
    if (!res.ok) {
      console.error('[email] Resend error:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[email] fetch error:', err)
    return false
  }
}

// ── Plantilla base ─────────────────────────────────────────────────────────

export function baseLayout(contenido: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#7a5c1e 0%,#c9962a 100%);padding:28px 32px">
                <a href="https://inmonest.com" style="text-decoration:none">
                  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">Inmon<span style="color:#fde68a">est</span></span>
                </a>
              </td>
            </tr>
            <!-- Contenido -->
            <tr>
              <td style="padding:32px">
                ${contenido}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
                <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
                  Este email fue enviado por <a href="https://inmonest.com" style="color:#c9962a;text-decoration:none">Inmonest</a> ·
                  Portal inmobiliario entre particulares · <a href="mailto:info@inmonest.com" style="color:#c9962a;text-decoration:none">info@inmonest.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

// ── Plantillas de email ────────────────────────────────────────────────────

/** Bienvenida al registrarse */
export function emailBienvenida(nombre: string, email: string) {
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#111827">¡Bienvenido a Inmonest, ${esc(nombre)}! 🎉</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
      Tu cuenta está activa. Ya puedes publicar anuncios, contactar propietarios y acceder a todos los servicios sin pagar comisiones.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      ${itemLista('🏠', 'Publica hasta 2 anuncios gratis', 'Sin cuotas de publicación ni comisiones')}
      ${itemLista('🔍', 'Busca pisos de particulares', 'Miles de inmuebles en toda España sin intermediarios')}
      ${itemLista('📋', 'Contratos redactados por gestores expertos', 'Alquiler LAU, arras, compraventa y más — precios cerrados IVA incl.')}
      ${itemLista('🏦', 'Oportunidades bancarias', 'Pisos de Solvia, Aliseda y Servihabitat desde 40.000 €')}
    </table>
    <a href="https://inmonest.com/mi-cuenta"
       style="display:inline-block;background:#c9962a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
      Ir a mi cuenta →
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">
      Tu email registrado: <strong style="color:#374151">${esc(email)}</strong>
    </p>
  `)
}

/** Confirmación de anuncio publicado */
export function emailAnuncioPublicado(nombre: string, titulo: string, listingId: string, precio: number, operacion: string) {
  const opLabel = operacion === 'rent' ? 'alquiler' : 'venta'
  const precioFmt = precio.toLocaleString('es-ES') + ' €' + (operacion === 'rent' ? '/mes' : '')
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827">¡Tu anuncio está publicado! 🏠</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hola <strong>${esc(nombre)}</strong>, tu inmueble ya está visible para miles de usuarios en Inmonest.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px">Tu anuncio</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827">${esc(titulo)}</p>
      <p style="margin:0;font-size:14px;color:#6b7280">${precioFmt} · En ${opLabel}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">
      Recibirás un email cada vez que alguien te contacte. Puedes gestionar tu anuncio desde tu panel de control.
    </p>
    <a href="https://inmonest.com/pisos/${listingId}"
       style="display:inline-block;background:#c9962a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-right:12px">
      Ver mi anuncio →
    </a>
    <a href="https://inmonest.com/mi-cuenta"
       style="display:inline-block;background:#f3f4f6;color:#374151;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
      Mi panel
    </a>
  `)
}

/** Confirmación de solicitud de gestoría al cliente */
export function emailGestoriaCliente(nombre: string, servicio: string, precio: number) {
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827">Solicitud recibida ✅</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hola <strong>${esc(nombre)}</strong>, hemos recibido tu solicitud de gestoría. Nuestro equipo de gestores expertos la procesará en menos de 24 horas.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px">Servicio solicitado</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827">${esc(servicio)}</p>
      <p style="margin:0;font-size:14px;color:#6b7280">${precio} €</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">
      En breve te contactaremos para confirmar los detalles y el proceso de pago. Si tienes dudas, escríbenos a
      <a href="mailto:info@inmonest.com" style="color:#c9962a">info@inmonest.com</a>.
    </p>
    <a href="https://inmonest.com/gestoria"
       style="display:inline-block;background:#c9962a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
      Ver servicios de gestoría →
    </a>
  `)
}

/** Acuse de recibo para leads (vender-casa, agencias) */
export function emailAcuseRecibo(nombre: string, tipoLead: 'vendedor' | 'agencia') {
  const textos = {
    vendedor: {
      titulo: 'Hemos recibido tu solicitud 🏠',
      cuerpo: 'Tu solicitud de valoración ha sido registrada. Nos pondremos en contacto contigo en menos de 24 horas para explicarte cómo publicar tu inmueble sin pagar comisión de agencia.',
      cta: 'Ver cómo funciona',
      href: 'https://inmonest.com/vender-casa',
    },
    agencia: {
      titulo: '¡Gracias por tu interés! 🏢',
      cuerpo: 'Hemos recibido tu solicitud para publicar en Inmonest. Un miembro de nuestro equipo te contactará en breve para explicarte las condiciones y ayudarte a empezar.',
      cta: 'Ver planes para agencias',
      href: 'https://inmonest.com/agencias',
    },
  }
  const t = textos[tipoLead]
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827">${t.titulo}</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hola <strong>${esc(nombre)}</strong>, ${t.cuerpo}
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#166534">
        ✅ Solicitud registrada correctamente · Te contactaremos en menos de 24 h
      </p>
    </div>
    <a href="${t.href}"
       style="display:inline-block;background:#c9962a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
      ${t.cta} →
    </a>
  `)
}

// ── Helpers internos ───────────────────────────────────────────────────────

export function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function itemLista(icono: string, titulo: string, desc: string) {
  return `
    <tr>
      <td style="padding:8px 0;vertical-align:top;width:36px;font-size:18px">${icono}</td>
      <td style="padding:8px 0 8px 8px">
        <p style="margin:0;font-size:14px;font-weight:700;color:#111827">${titulo}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280">${desc}</p>
      </td>
    </tr>
  `
}
