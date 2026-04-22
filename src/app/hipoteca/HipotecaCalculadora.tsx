'use client'

import { useState, useMemo } from 'react'

function calcCuota(capital: number, tinAnual: number, meses: number): number {
  if (meses <= 0 || capital <= 0) return 0
  const r = tinAnual / 100 / 12
  if (r === 0) return capital / meses
  return (capital * r * Math.pow(1 + r, meses)) / (Math.pow(1 + r, meses) - 1)
}

export default function HipotecaCalculadora() {
  const [precio, setPrecio] = useState(200000)
  const [entrada, setEntrada] = useState(40000)
  const [plazo, setPlazo] = useState(25)
  const [tin, setTin] = useState(3.2)

  const capital = Math.max(0, precio - entrada)
  const pct = precio > 0 ? Math.round((entrada / precio) * 100) : 0

  const cuota = useMemo(() => calcCuota(capital, tin, plazo * 12), [capital, tin, plazo])
  const totalPagar = cuota * plazo * 12
  const totalIntereses = totalPagar - capital

  const inputCls = 'w-full rounded-xl border border-[#f4c94a]/40 bg-[#0d1a0f]/60 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/50 focus:border-[#c9962a] placeholder-white/30'
  const labelCls = 'block text-xs font-semibold text-[#f4c94a] uppercase tracking-wider mb-1.5'

  return (
    <div className="bg-[#0d1a0f]/80 backdrop-blur-sm border border-[#c9962a]/30 rounded-3xl p-6 shadow-2xl">
      <p className="text-[#f4c94a] text-xs font-bold uppercase tracking-widest mb-5">🧮 Calculadora hipotecaria</p>

      <div className="space-y-4">
        {/* Precio del inmueble */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className={labelCls + ' mb-0'}>Precio del piso</label>
            <span className="text-white font-bold text-sm">{precio.toLocaleString('es-ES')} €</span>
          </div>
          <input
            type="range"
            min={50000}
            max={1000000}
            step={5000}
            value={precio}
            onChange={e => {
              const v = Number(e.target.value)
              setPrecio(v)
              if (entrada > v * 0.95) setEntrada(Math.round(v * 0.2))
            }}
            className="w-full accent-[#c9962a]"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
            <span>50.000 €</span><span>1.000.000 €</span>
          </div>
        </div>

        {/* Entrada */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className={labelCls + ' mb-0'}>Entrada ({pct}%)</label>
            <span className="text-white font-bold text-sm">{entrada.toLocaleString('es-ES')} €</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.round(precio * 0.5)}
            step={1000}
            value={entrada}
            onChange={e => setEntrada(Number(e.target.value))}
            className="w-full accent-[#c9962a]"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
            <span>0 €</span><span>{Math.round(precio * 0.5).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        {/* Plazo + TIN en línea */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className={labelCls + ' mb-0'}>Plazo</label>
              <span className="text-white font-bold text-sm">{plazo} años</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={plazo}
              onChange={e => setPlazo(Number(e.target.value))}
              className="w-full accent-[#c9962a]"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className={labelCls + ' mb-0'}>TIN</label>
              <span className="text-white font-bold text-sm">{tin.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.05}
              value={tin}
              onChange={e => setTin(Number(e.target.value))}
              className="w-full accent-[#c9962a]"
            />
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="mt-5 bg-[#c9962a]/10 border border-[#c9962a]/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/50 font-medium">Cuota mensual estimada</p>
          <p className="text-3xl font-black text-[#f4c94a]">
            {cuota > 0 ? cuota.toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '—'} €
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Capital</p>
            <p className="text-xs font-bold text-white">{capital.toLocaleString('es-ES')} €</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Total intereses</p>
            <p className="text-xs font-bold text-[#f4c94a]">{totalIntereses > 0 ? totalIntereses.toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '—'} €</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Total a pagar</p>
            <p className="text-xs font-bold text-white">{totalPagar > 0 ? totalPagar.toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '—'} €</p>
          </div>
        </div>
      </div>

      {pct < 20 && (
        <p className="mt-3 text-[10px] text-amber-400 bg-amber-900/30 rounded-lg px-3 py-2">
          ⚠️ La mayoría de bancos requieren al menos un 20% de entrada ({Math.round(precio * 0.2).toLocaleString('es-ES')} €).
        </p>
      )}

      <a
        href="#contacto"
        className="mt-4 block text-center bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold py-3 rounded-xl text-sm transition-colors"
      >
        Consultar mi viabilidad →
      </a>
    </div>
  )
}
