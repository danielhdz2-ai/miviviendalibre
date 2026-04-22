'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ListingData {
  id: string
  title: string
  description: string | null
  price_eur: number | null
  operation: string
  city: string | null
  district: string | null
  province: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  status: string
}

export default function EditarAnuncioForm({ listing }: { listing: ListingData }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title:       listing.title ?? '',
    description: listing.description ?? '',
    price_eur:   listing.price_eur?.toString() ?? '',
    operation:   listing.operation ?? 'sale',
    city:        listing.city ?? '',
    district:    listing.district ?? '',
    bedrooms:    listing.bedrooms?.toString() ?? '',
    bathrooms:   listing.bathrooms?.toString() ?? '',
    area_m2:     listing.area_m2?.toString() ?? '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setSuccess(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/mis-anuncios/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title.trim(),
          description: form.description.trim(),
          price_eur:   form.price_eur ? Number(form.price_eur) : undefined,
          operation:   form.operation,
          city:        form.city.trim(),
          district:    form.district.trim(),
          bedrooms:    form.bedrooms !== '' ? Number(form.bedrooms) : undefined,
          bathrooms:   form.bathrooms !== '' ? Number(form.bathrooms) : undefined,
          area_m2:     form.area_m2 !== '' ? Number(form.area_m2) : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error guardando')
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/40 focus:border-[#c9962a] transition-colors'
  const labelCls = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className={labelCls}>Título *</label>
        <input
          type="text"
          required
          maxLength={200}
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className={inputCls}
          placeholder="Ej: Piso luminoso de 3 hab en centro"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          rows={6}
          maxLength={3000}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          className={inputCls + ' resize-none'}
          placeholder="Describe el inmueble..."
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/3000</p>
      </div>

      {/* Precio + Operación */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Precio (€) *</label>
          <input
            type="number"
            required
            min={1}
            max={99999999}
            value={form.price_eur}
            onChange={e => set('price_eur', e.target.value)}
            className={inputCls}
            placeholder="Ej: 180000"
          />
        </div>
        <div>
          <label className={labelCls}>Operación</label>
          <select
            value={form.operation}
            onChange={e => set('operation', e.target.value)}
            className={inputCls + ' bg-white'}
          >
            <option value="sale">Venta</option>
            <option value="rent">Alquiler</option>
          </select>
        </div>
      </div>

      {/* Ciudad + Barrio */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ciudad</label>
          <input
            type="text"
            maxLength={100}
            value={form.city}
            onChange={e => set('city', e.target.value)}
            className={inputCls}
            placeholder="Ej: Madrid"
          />
        </div>
        <div>
          <label className={labelCls}>Barrio / Zona</label>
          <input
            type="text"
            maxLength={100}
            value={form.district}
            onChange={e => set('district', e.target.value)}
            className={inputCls}
            placeholder="Ej: Salamanca"
          />
        </div>
      </div>

      {/* Habitaciones + Baños + Superficie */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Habitaciones</label>
          <input
            type="number"
            min={0}
            max={20}
            value={form.bedrooms}
            onChange={e => set('bedrooms', e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelCls}>Baños</label>
          <input
            type="number"
            min={0}
            max={10}
            value={form.bathrooms}
            onChange={e => set('bathrooms', e.target.value)}
            className={inputCls}
            placeholder="1"
          />
        </div>
        <div>
          <label className={labelCls}>Superficie m²</label>
          <input
            type="number"
            min={1}
            max={9999}
            value={form.area_m2}
            onChange={e => set('area_m2', e.target.value)}
            className={inputCls}
            placeholder="80"
          />
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl">
          ✓ Cambios guardados correctamente
        </p>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-[#c9962a] hover:bg-[#b8841e] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <Link
          href="/mi-cuenta/anuncios"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center"
        >
          Cancelar
        </Link>
      </div>

      <p className="text-xs text-gray-400 pt-1">
        Para cambiar las fotos del anuncio, contacta con soporte.
      </p>
    </form>
  )
}
