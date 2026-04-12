'use client'

import { useState, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AddressSuggestion {
  display_name: string
  city: string
  postal_code: string
  province: string
  lat: string
  lon: string
}

interface FormData {
  // Paso 1
  address: string
  city: string
  postal_code: string
  province: string
  lat: string
  lng: string
  // Paso 2
  operation: 'sale' | 'rent'
  property_type: string
  area_m2: string
  bedrooms: string
  condition: string
  estimated_price: string
  // Paso 3
  name: string
  phone: string
  email: string
}

const INITIAL: FormData = {
  address: '', city: '', postal_code: '', province: '', lat: '', lng: '',
  operation: 'sale', property_type: 'piso', area_m2: '', bedrooms: '', condition: '', estimated_price: '',
  name: '', phone: '', email: '',
}

// ─── Address autocomplete via Nominatim (sin API key) ────────────────────────

function useAddressSearch() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 5) { setSuggestions([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', España')}&format=json&addressdetails=1&limit=5&countrycodes=es`
        const res = await fetch(url, { headers: { 'User-Agent': 'miviviendalibre.com/1.0' } })
        const data = await res.json() as Array<{
          display_name: string
          lat: string
          lon: string
          address: { city?: string; town?: string; village?: string; postcode?: string; state?: string }
        }>
        setSuggestions(data.map(d => ({
          display_name: d.display_name,
          city: d.address.city ?? d.address.town ?? d.address.village ?? '',
          postal_code: d.address.postcode ?? '',
          province: d.address.state ?? '',
          lat: d.lat,
          lon: d.lon,
        })))
      } catch { /* silenciar */ }
      finally { setLoading(false) }
    }, 400)
  }, [])

  return { suggestions, loading, setSuggestions, search }
}

// ─── Step indicators ─────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Dirección', 'Tu inmueble', 'Contacto']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1
        const active = idx === step
        const done = idx < step
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${done ? 'bg-[#c9962a] border-[#c9962a] text-white' :
                  active ? 'bg-white border-[#c9962a] text-[#c9962a] shadow-md' :
                  'bg-gray-100 border-gray-200 text-gray-400'}`}
              >
                {done ? '✓' : idx}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-[#c9962a]' : done ? 'text-[#c9962a]/70' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-all duration-300 ${done ? 'bg-[#c9962a]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VenderForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { suggestions, loading: addrLoading, setSuggestions, search } = useAddressSearch()

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  // Paso 1 — seleccionar sugerencia
  function selectAddress(s: AddressSuggestion) {
    setForm(prev => ({
      ...prev,
      address: s.display_name,
      city: s.city,
      postal_code: s.postal_code,
      province: s.province,
      lat: s.lat,
      lng: s.lon,
    }))
    setSuggestions([])
  }

  // Envío final
  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/owner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          area_m2: form.area_m2 ? parseInt(form.area_m2) : null,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          estimated_price: form.estimated_price ? parseInt(form.estimated_price.replace(/\D/g, '')) : null,
          lng: form.lng || null,
          lat: form.lat || null,
        }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setSubmitted(true)
    } catch {
      setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">¡Recibido!</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Hemos registrado tus datos. En menos de <strong>24 horas</strong> te contactaremos con las mejores agencias para tu zona.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fef9e8] border border-[#c9962a]/30 text-[#a87a20] text-sm font-semibold">
          📬 Revisa tu email en {form.email}
        </div>
      </div>
    )
  }

  return (
    <div>
      <StepBar step={step} />

      {/* ── PASO 1: Dirección ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">¿Dónde está el inmueble?</h3>
            <p className="text-sm text-gray-500">Escribe la dirección completa para localizar tu propiedad.</p>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dirección <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">📍</span>
              <input
                type="text"
                value={form.address}
                onChange={e => { set('address', e.target.value); search(e.target.value) }}
                placeholder="Ej: Calle Gran Vía 15, Madrid"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-gray-900 placeholder-gray-400 text-sm"
              />
              {addrLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">buscando…</span>
              )}
            </div>

            {suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => selectAddress(s)}
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-[#fef9e8] cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <span className="text-[#c9962a] mr-2">📍</span>
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {form.city && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ciudad</label>
                <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Código postal</label>
                <input type="text" value={form.postal_code} onChange={e => set('postal_code', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900" />
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!form.address}
            className="w-full py-3.5 rounded-2xl bg-[#c9962a] text-white font-bold text-base hover:bg-[#a87a20] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#c9962a]/30"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── PASO 2: Datos del inmueble ────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Cuéntanos sobre tu inmueble</h3>
            <p className="text-sm text-gray-500">Estos datos ayudan a las agencias a valorarlo mejor.</p>
          </div>

          {/* Operación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">¿Qué quieres hacer?</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'sale', label: 'Vender', icon: '🏷️' }, { v: 'rent', label: 'Alquilar', icon: '🔑' }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('operation', opt.v)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${form.operation === opt.v
                      ? 'border-[#c9962a] bg-[#fef9e8] text-[#a87a20]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de inmueble */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de inmueble</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'piso', label: 'Piso', icon: '🏢' },
                { v: 'casa', label: 'Casa', icon: '🏠' },
                { v: 'atico', label: 'Ático', icon: '🌇' },
                { v: 'local', label: 'Local', icon: '🏪' },
                { v: 'terreno', label: 'Terreno', icon: '🌿' },
                { v: 'otro', label: 'Otro', icon: '📦' },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('property_type', opt.v)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all flex flex-col items-center gap-1
                    ${form.property_type === opt.v
                      ? 'border-[#c9962a] bg-[#fef9e8] text-[#a87a20]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* m² y habitaciones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Superficie (m²)</label>
              <input
                type="number" min="10" max="2000"
                value={form.area_m2}
                onChange={e => set('area_m2', e.target.value)}
                placeholder="Ej: 90"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Habitaciones</label>
              <select
                value={form.bedrooms}
                onChange={e => set('bedrooms', e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900 bg-white"
              >
                <option value="">Seleccionar</option>
                <option value="0">Estudio</option>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} hab.</option>)}
              </select>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del inmueble</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'nuevo', label: 'Nuevo / Obra nueva' },
                { v: 'buen_estado', label: 'Buen estado' },
                { v: 'reformar', label: 'A reformar' },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('condition', opt.v)}
                  className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center
                    ${form.condition === opt.v
                      ? 'border-[#c9962a] bg-[#fef9e8] text-[#a87a20]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precio estimado (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Precio estimado <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.estimated_price}
                onChange={e => set('estimated_price', e.target.value)}
                placeholder="Ej: 250000"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">€</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
            >
              ← Volver
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] py-3 rounded-2xl bg-[#c9962a] text-white font-bold text-base hover:bg-[#a87a20] transition-all shadow-md shadow-[#c9962a]/30"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Contacto ──────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Tus datos de contacto</h3>
            <p className="text-sm text-gray-500">Las agencias te contactarán directamente. No compartimos tus datos con terceros.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: María García"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="Ej: 612 345 678"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="Ej: maria@email.com"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#c9962a] focus:ring-2 focus:ring-[#c9962a]/20 outline-none text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-[#fef9e8] rounded-xl p-4 border border-[#c9962a]/20 text-sm text-[#a87a20] space-y-1">
            <p className="font-semibold text-[#614510] mb-2">📋 Resumen de tu solicitud</p>
            <p>📍 {form.city || form.address}</p>
            {form.area_m2 && <p>📐 {form.area_m2} m²{form.bedrooms ? ` · ${form.bedrooms} hab.` : ''}</p>}
            <p>🔑 {form.operation === 'sale' ? 'Venta' : 'Alquiler'} — {form.property_type}</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.phone || !form.email || submitting}
              className="flex-[2] py-3 rounded-2xl bg-[#c9962a] text-white font-bold text-base hover:bg-[#a87a20] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#c9962a]/30"
            >
              {submitting ? 'Enviando…' : '🏠 Buscar agencias →'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Al enviar aceptas nuestra{' '}
            <a href="/privacidad" className="underline hover:text-gray-600">política de privacidad</a>.
            Contactaremos con un máximo de 4 agencias de tu zona.
          </p>
        </div>
      )}
    </div>
  )
}
