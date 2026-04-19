'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Datos ────────────────────────────────────────────────────────────────
type Item = { label: string; value: string }

const HAB_OPS: Item[] = [
  { label: 'Estudio', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4+', value: '4' },
]

const BANOS_OPS: Item[] = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3+', value: '3' },
]

const ESTADO_OPS: Item[] = [
  { label: 'Obra nueva', value: 'obra_nueva' },
  { label: 'Buen estado', value: 'buen_estado' },
  { label: 'A reformar', value: 'a_reformar' },
]

const CARACT_OPS: Item[] = [
  { label: 'Aire acondicionado', value: 'aire_acondicionado' },
  { label: 'Armarios empotrados', value: 'armarios' },
  { label: 'Ascensor', value: 'ascensor' },
  { label: 'Balcón y terraza', value: 'terraza' },
  { label: 'Exterior', value: 'exterior' },
  { label: 'Garaje', value: 'garaje' },
  { label: 'Jardín', value: 'jardin' },
  { label: 'Piscina', value: 'piscina' },
  { label: 'Trastero', value: 'trastero' },
  { label: 'Vivienda accesible', value: 'accesible' },
  { label: 'Vivienda de lujo', value: 'lujo' },
  { label: 'Vistas al mar', value: 'vistas_mar' },
]

const PLANTA_OPS: Item[] = [
  { label: 'Última planta', value: 'ultima' },
  { label: 'Plantas intermedias', value: 'intermedia' },
  { label: 'Bajos', value: 'bajos' },
]

const ENERGIA_OPS: Item[] = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
]

const MULTIMEDIA_OPS: Item[] = [
  { label: 'Con plano', value: 'plano' },
  { label: 'Con visita virtual', value: 'visita_virtual' },
]

const FECHA_OPS: Item[] = [
  { label: 'Indiferente', value: '' },
  { label: 'Últimas 48 horas', value: '48h' },
  { label: 'La última semana', value: 'semana' },
  { label: 'El último mes', value: 'mes' },
]

// ── Primitivos UI ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function PillGroup({
  items, active, onToggle,
}: { items: Item[]; active: string; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onToggle(active === it.value ? '' : it.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            active === it.value
              ? 'bg-gold-500 text-white border-gold-500'
              : 'border-gray-200 text-gray-600 hover:border-gold-400 hover:text-gold-700'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

function CheckGroup({
  items, active, onToggle,
}: { items: Item[]; active: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <label key={it.value} className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={active.includes(it.value)}
            onChange={() => onToggle(it.value)}
            className="w-4 h-4 rounded border-gray-300 accent-[#c9962a]"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">{it.label}</span>
        </label>
      ))}
    </div>
  )
}

function RadioGroup({
  items, active, onChange,
}: { items: Item[]; active: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <label key={it.value} className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="fecha_pub"
            checked={active === it.value}
            onChange={() => onChange(it.value)}
            className="w-4 h-4 border-gray-300 accent-[#c9962a]"
          />
          <span className="text-sm text-gray-700">{it.label}</span>
        </label>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
interface FiltersSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function FiltersSidebar({ isOpen, onClose }: FiltersSidebarProps) {
  const router = useRouter()
  const sp = useSearchParams()

  // Filtros base
  const [precioMin, setPrecioMin] = useState(sp.get('precio_min') ?? '')
  const [precioMax, setPrecioMax] = useState(sp.get('precio_max') ?? '')
  const [hab, setHab]             = useState(sp.get('hab') ?? '')
  const [banos, setBanos]         = useState(sp.get('banos') ?? '')
  const [areaMin, setAreaMin]     = useState(sp.get('area_min') ?? '')
  const [areaMax, setAreaMax]     = useState(sp.get('area_max') ?? '')

  // Filtros pro
  const [estado,    setEstado]    = useState(sp.get('estado') ?? '')
  const [caract,    setCaract]    = useState<string[]>(() => sp.get('caract')?.split(',').filter(Boolean) ?? [])
  const [planta,    setPlanta]    = useState(sp.get('planta') ?? '')
  const [energia,   setEnergia]   = useState(sp.get('energia') ?? '')
  const [multimedia, setMultimedia] = useState<string[]>(() => sp.get('multimedia')?.split(',').filter(Boolean) ?? [])
  const [fechaPub,  setFechaPub]  = useState(sp.get('fecha_pub') ?? '')

  const mk = useCallback(
    (overrides: Record<string, string>) => {
      const p = new URLSearchParams(sp.toString())
      p.delete('pagina')
      Object.entries(overrides).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
      return p.toString()
    },
    [sp],
  )

  const nav = useCallback((overrides: Record<string, string>) => {
    router.push(`/pisos?${mk(overrides)}`)
  }, [mk, router])

  function applyAll() {
    nav({
      precio_min: precioMin,
      precio_max: precioMax,
      hab,
      banos,
      area_min: areaMin,
      area_max: areaMax,
      estado,
      caract: caract.join(','),
      planta,
      energia,
      multimedia: multimedia.join(','),
      fecha_pub: fechaPub,
    })
    onClose()
  }

  function clearAll() {
    const keys = [
      'precio_min', 'precio_max', 'hab', 'banos', 'area_min', 'area_max',
      'estado', 'caract', 'planta', 'energia', 'multimedia', 'fecha_pub',
    ]
    const p = new URLSearchParams(sp.toString())
    keys.forEach((k) => p.delete(k))
    p.delete('pagina')
    router.push(`/pisos?${p.toString()}`)
    setPrecioMin(''); setPrecioMax(''); setHab(''); setBanos('')
    setAreaMin(''); setAreaMax(''); setEstado(''); setCaract([])
    setPlanta(''); setEnergia(''); setMultimedia([]); setFechaPub('')
    onClose()
  }

  const toggleList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value]

  const hasActive = !!(
    precioMin || precioMax || hab || banos || areaMin || areaMax ||
    estado || caract.length || planta || energia || multimedia.length || fechaPub
  )

  // ── Panel (compartido desktop/mobile) ──────────────────────────────────
  const panel = (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 text-base">Filtros</h2>
        <div className="flex items-center gap-3">
          {hasActive && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Limpiar todo
            </button>
          )}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Secciones */}
      <div className="flex-1 overflow-y-auto space-y-6">

        {/* Precio */}
        <Section title="Precio">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number" placeholder="Mín." value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)} onBlur={applyAll}
                className="w-full pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
            </div>
            <span className="text-gray-300">—</span>
            <div className="relative flex-1">
              <input
                type="number" placeholder="Máx." value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)} onBlur={applyAll}
                className="w-full pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
            </div>
          </div>
        </Section>

        {/* Habitaciones */}
        <Section title="Habitaciones">
          <PillGroup
            items={HAB_OPS} active={hab}
            onToggle={(v) => { setHab(v); nav({ hab: v }) }}
          />
        </Section>

        {/* Baños */}
        <Section title="Baños">
          <PillGroup
            items={BANOS_OPS} active={banos}
            onToggle={(v) => { setBanos(v); nav({ banos: v }) }}
          />
        </Section>

        {/* Superficie */}
        <Section title="Superficie">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number" placeholder="Mín." value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)} onBlur={applyAll}
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
            </div>
            <span className="text-gray-300">—</span>
            <div className="relative flex-1">
              <input
                type="number" placeholder="Máx." value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)} onBlur={applyAll}
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
            </div>
          </div>
        </Section>

        {/* Estado */}
        <Section title="Estado">
          <CheckGroup
            items={ESTADO_OPS}
            active={estado ? [estado] : []}
            onToggle={(v) => { const n = estado === v ? '' : v; setEstado(n); nav({ estado: n }) }}
          />
        </Section>

        {/* Características */}
        <Section title="Características">
          <CheckGroup
            items={CARACT_OPS}
            active={caract}
            onToggle={(v) => setCaract((prev) => toggleList(prev, v))}
          />
          <button
            onClick={() => nav({ caract: caract.join(',') })}
            className="mt-3 w-full py-2 rounded-lg border border-gold-300 text-gold-600 text-xs font-semibold hover:bg-gold-50 transition-colors"
          >
            Aplicar características
          </button>
        </Section>

        {/* Planta */}
        <Section title="Planta">
          <CheckGroup
            items={PLANTA_OPS}
            active={planta ? [planta] : []}
            onToggle={(v) => { const n = planta === v ? '' : v; setPlanta(n); nav({ planta: n }) }}
          />
        </Section>

        {/* Eficiencia energética */}
        <Section title="Eficiencia energética">
          <CheckGroup
            items={ENERGIA_OPS}
            active={energia ? [energia] : []}
            onToggle={(v) => { const n = energia === v ? '' : v; setEnergia(n); nav({ energia: n }) }}
          />
        </Section>

        {/* Multimedia */}
        <Section title="Multimedia">
          <CheckGroup
            items={MULTIMEDIA_OPS}
            active={multimedia}
            onToggle={(v) => {
              const n = toggleList(multimedia, v)
              setMultimedia(n)
              nav({ multimedia: n.join(',') })
            }}
          />
        </Section>

        {/* Tipo de anuncio */}
        <Section title="Tipo de anuncio">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={sp.get('solo_bancarias') === 'true'}
              onChange={(e) => {
                const p = new URLSearchParams(sp.toString())
                e.target.checked ? p.set('solo_bancarias', 'true') : p.delete('solo_bancarias')
                p.delete('pagina')
                router.push(`/pisos?${p.toString()}`)
              }}
              className="w-4 h-4 rounded border-gray-300 accent-[#c9962a]"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">De bancos</span>
          </label>
        </Section>

        {/* Fecha de publicación */}
        <Section title="Fecha de publicación">
          <RadioGroup
            items={FECHA_OPS}
            active={fechaPub}
            onChange={(v) => { setFechaPub(v); nav({ fecha_pub: v }) }}
          />
        </Section>

      </div>

      {/* Botón mobile */}
      <div className="lg:hidden pt-4 border-t border-gray-100 mt-4">
        <button
          onClick={applyAll}
          className="w-full py-3 rounded-full bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition-colors"
        >
          Aplicar filtros
        </button>
      </div>

    </div>
  )

  return (
    <>
      {/* Desktop: sidebar fija */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-20 bg-white p-5">
          {panel}
        </div>
      </aside>

      {/* Mobile: drawer overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl p-5 overflow-y-auto">
            {panel}
          </div>
        </div>
      )}
    </>
  )
}
