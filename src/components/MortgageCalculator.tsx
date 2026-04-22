'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Props {
  precioVivienda?: number
}

function calcCuota(capital: number, tinAnual: number, meses: number): number {
  if (meses <= 0 || capital <= 0 || tinAnual <= 0) return capital / (meses || 1)
  const r = tinAnual / 100 / 12
  return (capital * r * Math.pow(1 + r, meses)) / (Math.pow(1 + r, meses) - 1)
}

export default function MortgageCalculator({ precioVivienda }: Props) {
  const defaultPrecio = precioVivienda ?? 200000
  const [precio, setPrecio] = useState(defaultPrecio)
  const [pctEntrada, setPctEntrada] = useState(20)
  const [plazo, setPlazo] = useState(25)
  const [tin, setTin] = useState(3.2)

  const entrada = Math.round(precio * pctEntrada / 100)
  const capital = precio - entrada

  const cuota = useMemo(() => calcCuota(capital, tin, plazo * 12), [capital, tin, plazo])
  const totalPagar = cuota * plazo * 12
  const totalIntereses = totalPagar - capital

  const fmt = (n: number, dec = 0) => n.toLocaleString('es-ES', { maximumFractionDigits: dec })

  return (
    <div className="bg-[#fef9e8] rounded-2xl border border-[#f4c94a]/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#c9962a] text-lg">🏦</span>
        <h3 className="font-bold text-gray-900 text-sm">Calculadora hipotecaria</h3>
      </div>

      <div className="space-y-4">
        {/* Precio */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500 font-medium">Precio del inmueble</label>
            <span className="text-xs font-bold text-gray-900">{fmt(precio)} €</span>
          </div>
          <input
            type="range"
            min={30000}
            max={2000000}
            step={5000}
            value={precio}
            onChange={e => setPrecio(Number(e.target.value))}
            className="w-full accent-[#c9962a] h-1.5"
          />
        </div>

        {/* Entrada */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500 font-medium">Entrada ({pctEntrada}%)</label>
            <span className="text-xs font-bold text-gray-900">{fmt(entrada)} €</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={pctEntrada}
            onChange={e => setPctEntrada(Number(e.target.value))}
            className="w-full accent-[#c9962a] h-1.5"
          />
        </div>

        {/* Plazo + TIN */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500 font-medium">Plazo</label>
              <span className="text-xs font-bold text-gray-900">{plazo} años</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={plazo}
              onChange={e => setPlazo(Number(e.target.value))}
              className="w-full accent-[#c9962a] h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500 font-medium">TIN</label>
              <span className="text-xs font-bold text-gray-900">{tin.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.05}
              value={tin}
              onChange={e => setTin(Number(e.target.value))}
              className="w-full accent-[#c9962a] h-1.5"
            />
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-4 bg-white rounded-xl border border-[#f4c94a]/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">Cuota mensual estimada</span>
          <span className="text-2xl font-black text-[#c9962a]">{fmt(cuota)} €</span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-100 text-center">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Capital</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5">{fmt(capital)} €</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Intereses</p>
            <p className="text-xs font-bold text-[#c9962a] mt-0.5">{fmt(totalIntereses)} €</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5">{fmt(totalPagar)} €</p>
          </div>
        </div>
      </div>

      {pctEntrada < 20 && (
        <p className="mt-2.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ La mayoría de bancos exigen un mínimo del 20% de entrada.
        </p>
      )}

      {/* CTAs */}
      <div className="mt-4 space-y-2">
        <Link
          href="/hipoteca"
          className="flex items-center justify-between bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold px-4 py-3 rounded-xl text-xs transition-colors"
        >
          <span>¿Necesitas financiación? Inmonest tramita tu hipoteca</span>
          <span className="ml-2 shrink-0">→</span>
        </Link>
        <Link
          href="/gestoria"
          className="flex items-center justify-between border border-[#c9962a] text-[#c9962a] hover:bg-[#fef0c7] font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
        >
          <span>¿Cerrando el trato? Genera tu contrato con nuestra gestoría</span>
          <span className="ml-2 shrink-0">→</span>
        </Link>
      </div>
    </div>
  )
}
