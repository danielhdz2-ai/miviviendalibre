import type { DetectParticularResult } from '@/types/listings'

// Palabras que indican que el anuncio es de una inmobiliaria o agencia
const AGENCY_KEYWORDS = [
  'inmobiliaria',
  'agencia',
  'agente',
  'asesor inmobiliario',
  'consultor inmobiliario',
  'gestión inmobiliaria',
  'grupo inmobiliario',
  'servicios inmobiliarios',
  'real estate',
  'remax',
  're/max',
  'century 21',
  'tecnocasa',
  'solvia',
  'housell',
  'engel & völkers',
  'engel&volkers',
  'savills',
  'jll ',
  'cbre ',
  'gestión patrimonial',
  'promoción inmobiliaria',
  'promotor',
  'obra nueva',
  'development',
  'developer',
  'info@',
  'ventas@',
  'alquileres@',
  'contacto@',
  'administración de fincas',
  'comunidades',
  'portafolio',
  'portfolio',
]

// Palabras que indican que el anuncio es de un particular
const PARTICULAR_KEYWORDS = [
  'particular',
  'sin comisión',
  'sin comision',
  'sin agencia',
  'propietario',
  'dueño',
  'dueno',
  'vendo yo',
  'alquilo yo',
  'vendo directamente',
  'alquilo directamente',
  'no intermediarios',
  'sin intermediarios',
  'trato directo',
  'propietaria',
  'solo particulares',
  'privado',
]

// Palabras neutras o positivas en contexto de particular
const NEUTRAL_PARTICULAR_SIGNALS = [
  'mi piso',
  'mi apartamento',
  'mi casa',
  'nuestro piso',
  'nuestro apartamento',
  'nuestra casa',
  'mi vivienda',
  'heredado',
  'herencia',
]

export function detectParticular(
  title: string,
  description: string
): DetectParticularResult {
  const text = `${title} ${description}`.toLowerCase()
  const matchedKeywords: string[] = []

  // Comprobar señales de agencia (negativas)
  let agencyScore = 0
  for (const kw of AGENCY_KEYWORDS) {
    if (text.includes(kw)) {
      agencyScore += 1
      matchedKeywords.push(`[agencia] ${kw}`)
    }
  }

  // Comprobar señales de particular (positivas)
  let particularScore = 0
  for (const kw of PARTICULAR_KEYWORDS) {
    if (text.includes(kw)) {
      particularScore += 2 // Peso mayor a las señales explícitas
      matchedKeywords.push(`[particular] ${kw}`)
    }
  }

  // Señales neutras positivas
  for (const kw of NEUTRAL_PARTICULAR_SIGNALS) {
    if (text.includes(kw)) {
      particularScore += 1
      matchedKeywords.push(`[señal] ${kw}`)
    }
  }

  // Lógica de decisión
  if (agencyScore > 0 && particularScore === 0) {
    return {
      is_particular: false,
      confidence: Math.min(0.5 + agencyScore * 0.1, 0.95),
      matched_keywords: matchedKeywords,
    }
  }

  if (particularScore > 0 && agencyScore === 0) {
    return {
      is_particular: true,
      confidence: Math.min(0.6 + particularScore * 0.1, 0.99),
      matched_keywords: matchedKeywords,
    }
  }

  if (particularScore > agencyScore * 2) {
    return {
      is_particular: true,
      confidence: 0.7,
      matched_keywords: matchedKeywords,
    }
  }

  if (agencyScore > particularScore) {
    return {
      is_particular: false,
      confidence: 0.65,
      matched_keywords: matchedKeywords,
    }
  }

  // Caso ambiguo: confidence baja → se enviará a Claude Haiku
  return {
    is_particular: false,
    confidence: 0.5,
    matched_keywords: matchedKeywords,
  }
}
