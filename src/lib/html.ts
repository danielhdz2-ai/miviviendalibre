/**
 * Decodes HTML entities like &#xE1; → á, &amp; → &, etc.
 * Safe to call server-side (no DOM needed) and from client components.
 */
export function decodeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    // Hex entities: &#xE1; &#X1F4;
    .replace(/&#[Xx]([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    // Decimal entities: &#225;
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    // Named entities (most common subset)
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&apos;/g,  "'")
    .replace(/&nbsp;/g,  '\u00A0')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&uuml;/g,   'ü')
    .replace(/&Uuml;/g,   'Ü')
}
