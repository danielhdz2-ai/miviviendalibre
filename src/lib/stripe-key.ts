/**
 * Devuelve la Stripe Secret Key limpia como string.
 *
 * Problema conocido: si la clave se subió a Vercel via PowerShell con
 * Set-Content -Encoding Byte, el valor llega como bytes separados por espacio
 * ("115 107 95 116 101 ...") en lugar del string real ("sk_test_51...").
 * Esta función detecta ese caso y lo decodifica automáticamente.
 */
export function getStripeKey(): string {
  const raw = process.env.STRIPE_SECRET_KEY ?? ''
  return decodeEnvKey(raw)
}

/**
 * Decodifica una variable de entorno que puede haberse guardado como bytes.
 * Si todos los tokens son números 0-255 → los convierte a caracteres ASCII.
 * Si no → devuelve el string tal cual (solo trimmeado).
 */
export function decodeEnvKey(raw: string): string {
  const trimmed = String(raw).trim()
  const parts = trimmed.split(/\s+/)
  if (
    parts.length > 10 &&
    parts.every(p => /^\d{1,3}$/.test(p) && parseInt(p, 10) <= 255)
  ) {
    // La clave llegó como bytes ASCII separados por espacio → decodificar
    const decoded = parts.map(p => String.fromCharCode(parseInt(p, 10))).join('')
    console.warn('[stripe-key] AVISO: STRIPE_SECRET_KEY estaba en formato bytes. Decodificada OK. Vuelve a subir la clave correctamente a Vercel.')
    return decoded.trim()
  }
  return trimmed
}
