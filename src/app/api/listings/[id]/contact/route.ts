import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAIL, getListingNotifyEmails } from '@/lib/email'

interface Params {
  params: Promise<{ id: string }>
}

const RESEND_API  = 'https://api.resend.com/emails'
const FROM_EMAIL  = () => process.env.CONTACT_FROM_EMAIL ?? 'Inmonest <info@inmonest.com>'

async function sendEmail(
  key: string,
  payload: { from: string; to: string[]; reply_to?: string; subject: string; html: string }
): Promise<'sent' | 'failed'> {
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[listing/contact] Resend error:', res.status, err)
      return 'failed'
    }
    return 'sent'
  } catch (err) {
    console.error('[listing/contact] fetch error:', err)
    return 'failed'
  }
}

function buildContactHtml(opts: {
  safeName: string; safeEmail: string; safePhone: string
  safeMsg: string; safeTitle: string; safeCity: string
  listingId: string; fecha: string
}) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#222;padding:24px">
      <div style="background:linear-gradient(to right,#7a5c1e,#c9962a);border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <h2 style="color:#fff;margin:0">Nuevo mensaje en tu anuncio</h2>
        <p style="color:#ffedd5;margin:4px 0 0">${opts.safeTitle}${opts.safeCity ? ` — ${opts.safeCity}` : ''}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="background:#f9fafb">
          <td style="padding:10px 14px;font-weight:600;color:#555;width:30%">Nombre</td>
          <td style="padding:10px 14px">${opts.safeName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#555">Email</td>
          <td style="padding:10px 14px"><a href="mailto:${opts.safeEmail}" style="color:#c9962a">${opts.safeEmail}</a></td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px 14px;font-weight:600;color:#555">Teléfono</td>
          <td style="padding:10px 14px">${opts.safePhone}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#555">Mensaje</td>
          <td style="padding:10px 14px;white-space:pre-wrap">${opts.safeMsg}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px 14px;font-weight:600;color:#555">Anuncio</td>
          <td style="padding:10px 14px">
            <a href="https://inmonest.com/pisos/${opts.listingId}" style="color:#c9962a">Ver anuncio ↗</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#555">Fecha</td>
          <td style="padding:10px 14px">${opts.fecha}</td>
        </tr>
      </table>
      <div style="margin-top:20px;padding:14px 16px;background:#fffbeb;border-left:4px solid #c9962a;border-radius:0 8px 8px 0;font-size:13px;color:#92400e">
        Responde directamente a este email para contactar con ${opts.safeName}.
      </div>
      <p style="font-size:11px;color:#9ca3af;margin-top:16px">Inmonest · inmonest.com</p>
    </div>
  `
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: listingId } = await params

  let body: { from_name?: string; from_email?: string; from_phone?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { from_name, from_email, from_phone, message } = body

  if (!from_name?.trim() || !from_email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 422 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from_email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 422 })
  }

  const supabase = await createClient()

  // Obtener anuncio + propietario
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .select('id, title, status, city, owner_user_id')
    .eq('id', listingId)
    .eq('status', 'published')
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 })
  }

  // Insertar contacto en BD (admin client para bypass RLS)
  const adminSbInsert = createAdminClient()
  const { data: contactRow, error: insertErr } = await adminSbInsert
    .from('listing_contacts')
    .insert({
      listing_id:    listingId,
      owner_user_id: listing.owner_user_id ?? null,
      from_name:     from_name.trim().slice(0, 100),
      from_email:    from_email.trim().slice(0, 200),
      from_phone:    from_phone?.trim().slice(0, 30) ?? null,
      message:       message.trim().slice(0, 2000),
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('listing_contacts insert error:', insertErr)
    return NextResponse.json({ error: 'Error al guardar el mensaje' }, { status: 500 })
  }

  // ── Envío de emails ────────────────────────────────────────────────────────
  const RESEND_KEY = process.env.RESEND_API_KEY
  let ownerStatus: string = 'no_key'
  let replyStatus: string = 'no_key'

  if (RESEND_KEY) {
    const safeName  = from_name.trim().replace(/</g, '&lt;')
    const safeEmail = from_email.trim().replace(/</g, '&lt;')
    const safePhone = (from_phone ?? '—').replace(/</g, '&lt;')
    const safeMsg   = message.trim().replace(/</g, '&lt;').replace(/\n/g, '<br>')
    const safeTitle = (listing.title ?? listingId).replace(/</g, '&lt;')
    const safeCity  = (listing.city ?? '').replace(/</g, '&lt;')
    const fecha     = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
    const html      = buildContactHtml({ safeName, safeEmail, safePhone, safeMsg, safeTitle, safeCity, listingId, fecha })

    // 1. Obtener email del propietario vía Admin API
    let ownerEmail: string | null = null
    if (listing.owner_user_id) {
      try {
        const adminSb = createAdminClient()
        const { data: userData } = await adminSb.auth.admin.getUserById(listing.owner_user_id!)
        ownerEmail = userData?.user?.email ?? null
      } catch (err) {
        console.error('[listing/contact] no se pudo obtener email del propietario:', err)
      }
    }

    // 2. Email al propietario del anuncio
    if (ownerEmail && ownerEmail !== ADMIN_EMAIL) {
      ownerStatus = await sendEmail(RESEND_KEY, {
        from:     FROM_EMAIL(),
        to:       [ownerEmail],
        reply_to: from_email.trim(),
        subject:  `Nuevo mensaje en tu anuncio — ${listing.title ?? listingId}`,
        html,
      })
    } else if (ownerEmail === ADMIN_EMAIL || !ownerEmail) {
      // Propietario es admin o no encontrado → notificar solo a admin
      ownerStatus = await sendEmail(RESEND_KEY, {
        from:     FROM_EMAIL(),
        to:       getListingNotifyEmails(),
        reply_to: from_email.trim(),
        subject:  `Nuevo contacto en anuncio — ${safeTitle}`,
        html,
      })
    }

    // Siempre notificar también al admin (copia)
    if (ownerEmail && ownerEmail !== ADMIN_EMAIL) {
      await sendEmail(RESEND_KEY, {
        from:    FROM_EMAIL(),
        to:      getListingNotifyEmails(),
        reply_to: from_email.trim(),
        subject: `[copia] Contacto en anuncio — ${safeTitle}`,
        html,
      })
    }

    // 3. Auto-respuesta al interesado
    replyStatus = await sendEmail(RESEND_KEY, {
      from:    FROM_EMAIL(),
      to:      [from_email.trim()],
      subject: `✅ Hemos enviado tu mensaje — Inmonest`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#222;padding:24px">
          <div style="background:linear-gradient(to right,#7a5c1e,#c9962a);border-radius:12px;padding:20px 24px;margin-bottom:24px">
            <h2 style="color:#fff;margin:0">✅ Mensaje enviado</h2>
            <p style="color:#ffedd5;margin:4px 0 0">${safeTitle}</p>
          </div>
          <p style="font-size:15px;line-height:1.6">Hola <strong>${safeName}</strong>,</p>
          <p style="font-size:15px;line-height:1.6;color:#555">
            El propietario del anuncio ha recibido tu mensaje y te responderá directamente a
            <strong>${safeEmail}</strong> en cuanto pueda.
          </p>
          <div style="background:#f9fafb;border-left:4px solid #c9962a;padding:12px 16px;margin:20px 0;font-size:14px;color:#555">
            <strong>Tu mensaje:</strong><br/>
            <span style="white-space:pre-wrap">${safeMsg}</span>
          </div>
          <a href="https://inmonest.com/pisos/${listingId}"
             style="display:inline-block;background:#c9962a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Ver el anuncio
          </a>
          <p style="font-size:11px;color:#9ca3af;margin-top:24px">
            Inmonest · <a href="https://inmonest.com" style="color:#c9962a">inmonest.com</a>
          </p>
        </div>
      `,
    })
  }

  // ── Guardar estado de envío en BD ─────────────────────────────────────────
  if (contactRow?.id) {
    // Usar admin client para UPDATE (bypass RLS)
    try {
      const adminSb = createAdminClient()
      await adminSb.from('listing_contacts').update({
        email_owner_status: ownerStatus,
        email_reply_status: replyStatus,
        email_sent_at:      new Date().toISOString(),
      }).eq('id', contactRow.id)
    } catch (err) {
      console.error('[listing/contact] no se pudo guardar email_status:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
