import type { DueDiligenceFaqItem } from './due-diligence-ciudad-faq'
import { getAsesoriaFaqBasePorCiudad } from './asesoria-compra-ciudad-enriquecimiento'

export function getAsesoriaCompraFaq(
  slug: string,
  nombre: string,
  region: string,
  precioEjemplo: number,
  prioritarias: DueDiligenceFaqItem[] = [],
): DueDiligenceFaqItem[] {
  const comisionMin = Math.round(precioEjemplo * 0.03)
  const comisionMax = Math.round(precioEjemplo * 0.05)

  const precioItem: DueDiligenceFaqItem = {
    q: `¿Cuánto cuesta comprar piso de particular en ${nombre} con gestoría?`,
    a: `687€ IVA incluido por acompañamiento completo desde reserva hasta escritura. Frente a ${comisionMin.toLocaleString('es-ES')}–${comisionMax.toLocaleString('es-ES')}€ de comisión de agencia (3-5%) en un piso de ${precioEjemplo.toLocaleString('es-ES')}€.`,
  }

  const base = getAsesoriaFaqBasePorCiudad(slug, nombre, region, precioEjemplo)

  if (prioritarias.length > 0) {
    return [...prioritarias, precioItem, ...base]
  }

  return [precioItem, ...base]
}
