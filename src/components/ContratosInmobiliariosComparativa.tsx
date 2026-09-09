'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { GestoriaCheckIcon } from '@/components/ui/GestoriaCheckIcon'
import { CONTRATOS_CIUDAD_PRECIOS } from '@/lib/contratos-inmobiliarios-ciudades'
import { getPrecioServicio } from '@/lib/gestoria-catalogo'

const VENTA_COMPLETA_PRECIO = getPrecioServicio('compra-completa-reserva-escritura') ?? 687
const ARRAS_PRECIO = CONTRATOS_CIUDAD_PRECIOS.arras
const ALQUILER_PRECIO = CONTRATOS_CIUDAD_PRECIOS.alquiler
const AGENCIA_ALQUILER_DEFAULT = 3_000
const COMISION_AGENCIA_PCT = 0.05

const BENEFICIOS_INMONEST = [
  {
    titulo: 'Sin comisión sobre el precio',
    desc: 'Tarifa fija por contrato o servicio completo. No pagas el 3-5 % de una agencia sobre la venta del piso.',
  },
  {
    titulo: 'Contratos redactados por gestoría',
    desc: 'Arras, alquiler LAU, reserva y packs documentales personalizados — no plantillas genéricas de internet.',
  },
  {
    titulo: 'Gestor asignado con seguimiento',
    desc: 'Panel online, WhatsApp y teléfono directo. Revisión de cláusulas antes de firmar.',
  },
  {
    titulo: 'Entrega en 48 h',
    desc: 'PDF firmable digitalmente. FirmaCert incluida en servicios de gestoría.',
  },
  {
    titulo: 'Particulares sin intermediarios',
    desc: 'Pensado para quien compra, vende o alquila en Idealista, Fotocasa o entre conocidos.',
  },
  {
    titulo: 'Normativa 2026 actualizada',
    desc: 'LAU, Ley de Vivienda, arras penitenciales y documentación autonómica según tu CCAA.',
  },
] as const

function formatEur(n: number) {
  return `${n.toLocaleString('es-ES')} €`
}

type Props = {
  ciudadNombre?: string
  /** Precio de venta de ejemplo para la tabla compraventa */
  precioEjemploVenta?: number
  /** Lo que suele cobrar una agencia por gestionar un alquiler (honorarios fijos) */
  precioAgenciaAlquiler?: number
  /** Ocultar grid de beneficios si la página ya los tiene (p. ej. hub nacional) */
  showBeneficios?: boolean
}

export default function ContratosInmobiliariosComparativa({
  ciudadNombre,
  precioEjemploVenta: precioProp = 250_000,
  precioAgenciaAlquiler = AGENCIA_ALQUILER_DEFAULT,
  showBeneficios = true,
}: Props) {
  const [precioVenta, setPrecioVenta] = useState(precioProp)

  const comisionAgencia = useMemo(
    () => Math.round(precioVenta * COMISION_AGENCIA_PCT),
    [precioVenta],
  )
  const ahorroVentaCompleta = comisionAgencia - VENTA_COMPLETA_PRECIO
  const ahorroSoloArras = comisionAgencia - ARRAS_PRECIO
  const ahorroAlquiler = precioAgenciaAlquiler - ALQUILER_PRECIO

  const contexto = ciudadNombre ? ` en ${ciudadNombre}` : ''

  return (
    <section className="border-t border-gray-100 bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
            Por qué Inmonest
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {showBeneficios
              ? `Beneficios de trabajar con Inmonest${contexto}`
              : `Comparativa de costes: agencia vs Inmonest${contexto}`}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
            {showBeneficios
              ? 'Operas entre particulares con la misma seriedad jurídica que una gestoría profesional, pero sin pagar comisión del 5 % en compraventa ni miles de euros en gestión de alquiler.'
              : 'Calcula el ahorro frente a una agencia al 5 % en venta, o frente a los ~3.000 € habituales en gestión de alquiler.'}
          </p>
        </div>

        {showBeneficios && (
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS_INMONEST.map((b) => (
              <div
                key={b.titulo}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <GestoriaCheckIcon className="mb-2 text-gold-500" />
                <h3 className="mb-1 text-sm font-bold text-gray-900">{b.titulo}</h3>
                <p className="text-xs leading-relaxed text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Compraventa */}
        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Compraventa: agencia al 5 % vs Inmonest
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            Compara lo que cobra una inmobiliaria tradicional (5 % del precio de venta) frente a
            nuestro acompañamiento completo hasta escritura o solo el contrato de arras
            penitenciales.
          </p>

          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Precio de venta de ejemplo
          </label>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <input
              type="range"
              min={80_000}
              max={600_000}
              step={5_000}
              value={precioVenta}
              onChange={(e) => setPrecioVenta(Number(e.target.value))}
              className="h-2 min-w-[200px] flex-1 cursor-pointer accent-gold-500"
              aria-label="Precio de venta de ejemplo"
            />
            <span className="text-lg font-bold tabular-nums text-gold-700">
              {formatEur(precioVenta)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold text-gray-700">Concepto</th>
                  <th className="p-4 text-center font-semibold text-gray-500">
                    Agencia inmobiliaria (5 %)
                  </th>
                  <th className="p-4 text-center font-semibold text-gold-700">
                    Inmonest venta completa
                  </th>
                  <th className="p-4 text-center font-semibold text-gold-700">
                    Inmonest solo arras
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-900">Coste del servicio</td>
                  <td className="p-4 text-center font-bold text-gray-700">
                    {formatEur(comisionAgencia)}
                  </td>
                  <td className="p-4 text-center font-bold text-gold-700">
                    {formatEur(VENTA_COMPLETA_PRECIO)}
                  </td>
                  <td className="p-4 text-center font-bold text-gold-700">
                    {formatEur(ARRAS_PRECIO)}
                  </td>
                </tr>
                <tr className="border-b bg-green-50/60">
                  <td className="p-4 font-medium text-gray-900">Ahorro vs agencia</td>
                  <td className="p-4 text-center text-gray-400">—</td>
                  <td className="p-4 text-center font-bold text-green-700">
                    {formatEur(Math.max(0, ahorroVentaCompleta))}
                  </td>
                  <td className="p-4 text-center font-bold text-green-700">
                    {formatEur(Math.max(0, ahorroSoloArras))}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 text-gray-700">Qué incluye</td>
                  <td className="p-4 text-center text-xs text-gray-500">
                    Intermediación y comercialización. A menudo defiende al vendedor, no al comprador.
                  </td>
                  <td className="p-4 text-center text-xs text-gray-600">
                    Gestor desde reserva hasta escritura: arras, documentación, notaría.
                  </td>
                  <td className="p-4 text-center text-xs text-gray-600">
                    Contrato de arras penitenciales redactado + revisión registral. PDF en 48 h.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/gestoria/solicitar/compra-completa-reserva-escritura"
              className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-gold-600"
            >
              Venta / compra completa — {formatEur(VENTA_COMPLETA_PRECIO)}
            </Link>
            <Link
              href="/gestoria/solicitar/arras-penitenciales"
              className="rounded-lg border border-gold-400 bg-white px-5 py-2.5 text-sm font-bold text-gold-700 hover:bg-gold-50"
            >
              Solo arras — {formatEur(ARRAS_PRECIO)}
            </Link>
          </div>
        </div>

        {/* Alquiler */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Alquiler: agencia vs contrato LAU Inmonest
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            Muchas inmobiliarias cobran entre 2.500 € y 3.500 € por gestionar un alquiler (honorarios
            fijos o equivalente a una mensualidad). Inmonest redacta el contrato LAU por tarifa plana.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold text-gray-700">Concepto</th>
                  <th className="p-4 text-center font-semibold text-gray-500">
                    Agencia inmobiliaria (gestión alquiler)
                  </th>
                  <th className="p-4 text-center font-semibold text-gold-700">
                    Inmonest contrato alquiler LAU
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-900">Coste típico del servicio</td>
                  <td className="p-4 text-center font-bold text-gray-700">
                    {formatEur(precioAgenciaAlquiler)}
                  </td>
                  <td className="p-4 text-center font-bold text-gold-700">
                    {formatEur(ALQUILER_PRECIO)}
                  </td>
                </tr>
                <tr className="border-b bg-green-50/60">
                  <td className="p-4 font-medium text-gray-900">Ahorro vs agencia</td>
                  <td className="p-4 text-center text-gray-400">—</td>
                  <td className="p-4 text-center font-bold text-green-700">
                    {formatEur(Math.max(0, ahorroAlquiler))}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 text-gray-700">Qué incluye</td>
                  <td className="p-4 text-center text-xs text-gray-500">
                    Búsqueda de inquilino, visitas y a veces contrato estándar. Comisión recurrente en
                    algunos casos.
                  </td>
                  <td className="p-4 text-center text-xs text-gray-600">
                    Contrato LAU personalizado, Ley de Vivienda 2026, fianza, inventario y gestor
                    asignado. Entrega en 48 h.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            * Honorario de agencia orientativo ({formatEur(precioAgenciaAlquiler)}): habitual en
            gestión integral de alquiler en España. Puede variar según ciudad y servicios incluidos.
          </p>

          <div className="mt-6">
            <Link
              href="/gestoria/solicitar/contrato-alquiler"
              className="inline-flex rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-gold-600"
            >
              Contratar alquiler LAU — {formatEur(ALQUILER_PRECIO)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
