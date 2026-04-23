?'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FormData {
  operation: 'rent' | 'sale' | ''
  province: string
  city: string
  district: string
  postal_code: string
  price: string
  bedrooms: string
  bathrooms: string
  area: string
  title: string
  description: string
  features: string[]
}

const STEPS = ['Operación', 'Ubicación', 'Características', 'Extras y fotos']

const CIUDADES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
  'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón',
  'Granada', 'Hospitalet', 'La Coruña', 'Vitoria', 'Elche',
]

const AMENITIES = [
  { key: 'ascensor',           label: 'Ascensor',              emoji: '🛗' },
  { key: 'terraza',            label: 'Terraza',               emoji: '🌿' },
  { key: 'garaje',             label: 'Garaje',                emoji: '🚗' },
  { key: 'piscina',            label: 'Piscina',               emoji: '🏊' },
  { key: 'trastero',           label: 'Trastero',              emoji: '📦' },
  { key: 'jardin',             label: 'Jardín',                emoji: '🌳' },
  { key: 'aire_acondicionado', label: 'Aire acondicionado',    emoji: '❄️' },
  { key: 'armarios_empotrados',label: 'Armarios empotrados',   emoji: '🚪' },
  { key: 'exterior',           label: 'Exterior',              emoji: '☀️' },
  { key: 'amueblado',          label: 'Amueblado',             emoji: '🛋️' },
  { key: 'calefaccion',        label: 'Calefacción',           emoji: '🔥' },
  { key: 'portero_automatico', label: 'Portero automático',    emoji: '🔔' },
]

// ── WebP compression via Canvas API ─────────────────────────────────────────
async function compressToWebP(file: File, maxWidth = 1400, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          // Only use WebP if it actually reduces size
          if (blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          } else {
            resolve(file)
          }
        },
        'image/webp',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export default function PublicarWizard({ userId }: { userId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState<FormData>({
    operation: '', province: '', city: '', district: '', postal_code: '',
    price: '', bedrooms: '2', bathrooms: '1', area: '', title: '', description: '',
    features: [],
  })
  const [images,   setImages]   = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleFeature = (key: string) =>
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter(f => f !== key)
        : [...prev.features, key],
    }))

  const canNext = () => {
    if (step === 1) return form.operation !== ''
    if (step === 2) return form.city.trim() !== '' && form.price.trim() !== ''
    return true
  }

  const autoTitle = () => {
    const hab    = form.bedrooms === '0' ? 'Estudio' : `Piso ${form.bedrooms} hab.`
    const ciudad = form.city ? ` en ${form.city}` : ''
    const dist   = form.district ? `, ${form.district}` : ''
    return `${hab}${ciudad}${dist} — propietario, sin comisión`
  }

  const handleGenerateAI = async () => {
    setAiLoading(true); setAiError('')
    try {
      const res = await fetch('/api/generar-descripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: form.operation, city: form.city, district: form.district,
          bedrooms: form.bedrooms, bathrooms: form.bathrooms,
          area: form.area, price: form.price,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar')
      if (data.title)       set('title', data.title)
      if (data.description) set('description', data.description)
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Error al generar con IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleImages = useCallback(async (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 10 - images.length)
    const valid    = newFiles.filter(f => f.type.startsWith('image/') && f.size < 15 * 1024 * 1024)
    if (!valid.length) return

    setCompressing(true)
    try {
      const compressed = await Promise.all(valid.map(f => compressToWebP(f)))
      setImages(prev => [...prev, ...compressed])
      compressed.forEach(f => {
        const reader = new FileReader()
        reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string])
        reader.readAsDataURL(f)
      })
    } finally {
      setCompressing(false)
    }
  }, [images])

  const removeImage = (i: number) => {
    setImages(prev   => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handlePublish = async () => {
    setLoading(true); setError('')
    try {
      const titleToUse = form.title.trim() || autoTitle()

      // Build features object from selected amenities
      const featuresObj: Record<string, string> = {}
      form.features.forEach(k => { featuresObj[k] = 'true' })

      const res = await fetch('/api/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          title:    titleToUse,
          province: form.province || form.city,
          features: featuresObj,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al publicar')

      const listingId: string = data.id

      // Upload compressed images
      if (images.length > 0) {
        const supabase = createClient()
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const ext  = file.name.split('.').pop() ?? 'webp'
          const path = `${userId}/${listingId}/${i}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('listings')
            .upload(path, file, { upsert: true, contentType: file.type })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('listings').getPublicUrl(path)
            await supabase.from('listing_images').insert({
              listing_id:   listingId,
              storage_path: path,
              external_url: urlData.publicUrl,
              position:     i,
            })
          }
        }

        // Mark has_images = true
        await supabase
          .from('listings')
          .update({ has_images: true })
          .eq('id', listingId)
      }

      router.push(`/pisos/${listingId}?publicado=1`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al publicar')
      setLoading(false)
    }
  }

  const pill = (active: boolean) =>
    `w-12 h-10 rounded-lg text-sm font-medium border transition-all ${
      active
        ? 'bg-[#c9962a] text-white border-[#c9962a]'
        : 'border-[#f4c94a]/60 text-[#7a5c1e] hover:border-[#c9962a]'
    }`

  const inputCls = 'w-full border border-[#f4c94a]/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9962a] focus:ring-1 focus:ring-[#c9962a]'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Título */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#7a5c1e] mb-2">Publica tu anuncio</h1>
        <p className="text-[#9c7a3c]">Gratis · Sin comisiones · Trato directo</p>
      </div>

      {/* Indicadores de paso */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = n === step
          const done   = n < step
          return (
            <div key={n} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done   ? 'bg-[#c9962a] text-white' :
                  active ? 'bg-[#c9962a] text-white ring-4 ring-[#f4c94a]/40' :
                  'bg-[#f4c94a]/30 text-[#9c7a3c]'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs hidden sm:block ${active ? 'text-[#c9962a] font-semibold' : 'text-[#9c7a3c]'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${done ? 'bg-[#c9962a]' : 'bg-[#f4c94a]/30'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Tarjeta */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#f4c94a]/30 p-8">

        {/* Paso 1: Operación */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[#7a5c1e] mb-6">¿Qué quieres hacer?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'rent', label: 'Alquilar', desc: 'Pongo mi piso en alquiler', emoji: '🏠' },
                { value: 'sale', label: 'Vender',   desc: 'Quiero vender mi propiedad', emoji: '🔑' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('operation', opt.value)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    form.operation === opt.value
                      ? 'border-[#c9962a] bg-[#fef9e8]'
                      : 'border-[#f4c94a]/40 hover:border-[#c9962a]/50 hover:bg-[#fef9e8]/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <div className="font-bold text-[#7a5c1e] text-lg">{opt.label}</div>
                  <div className="text-sm text-[#9c7a3c] mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Ubicación y precio */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[#7a5c1e] mb-6">Ubicación y precio</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7a5c1e] mb-1">Ciudad *</label>
                  <input
                    list="ciudades-list"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Madrid, Barcelona..."
                    className={inputCls}
                  />
                  <datalist id="ciudades-list">
                    {CIUDADES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a5c1e] mb-1">Barrio / Zona</label>
                  <input
                    value={form.district}
                    onChange={e => set('district', e.target.value)}
                    placeholder="Malasaña, Gràcia..."
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7a5c1e] mb-1">Código postal</label>
                  <input
                    value={form.postal_code}
                    onChange={e => set('postal_code', e.target.value)}
                    placeholder="28004"
                    maxLength={5}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a5c1e] mb-1">
                    Precio {form.operation === 'rent' ? '(€/mes) *' : '(€) *'}
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder={form.operation === 'rent' ? '900' : '250000'}
                    min={0}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Características */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[#7a5c1e] mb-6">Características</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#7a5c1e] mb-2">Habitaciones</label>
                <div className="flex gap-2">
                  {['0','1','2','3','4','5'].map(n => (
                    <button key={n} onClick={() => set('bedrooms', n)} className={pill(form.bedrooms === n)}>
                      {n === '0' ? 'Est.' : n === '5' ? '5+' : n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7a5c1e] mb-2">Baños</label>
                <div className="flex gap-2">
                  {['1','2','3','4'].map(n => (
                    <button key={n} onClick={() => set('bathrooms', n)} className={pill(form.bathrooms === n)}>
                      {n === '4' ? '4+' : n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7a5c1e] mb-1">Superficie (m²)</label>
                <input
                  type="number"
                  value={form.area}
                  onChange={e => set('area', e.target.value)}
                  placeholder="75"
                  min={0}
                  className="w-32 border border-[#f4c94a]/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9962a] focus:ring-1 focus:ring-[#c9962a]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Extras, descripción y fotos */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-[#7a5c1e] mb-6">Extras, descripción y fotos</h2>
            <div className="space-y-6">

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-[#7a5c1e] mb-3">
                  Extras de la propiedad
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITIES.map(({ key, label, emoji }) => {
                    const active = form.features.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleFeature(key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
                          active
                            ? 'border-[#c9962a] bg-[#fef9e8] text-[#7a5c1e]'
                            : 'border-[#f4c94a]/40 text-[#9c7a3c] hover:border-[#c9962a]/50'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                        {active && <span className="ml-auto text-[#c9962a] text-xs">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-[#7a5c1e] mb-1">Título del anuncio</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={autoTitle()}
                  maxLength={120}
                  className={inputCls}
                />
                <p className="text-xs text-[#9c7a3c] mt-1">Si lo dejas vacío se usará el título sugerido</p>
              </div>

              {/* Descripción + IA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#7a5c1e]">Descripción</label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiLoading || !form.city}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef9e8] text-[#c9962a] border border-[#f4c94a] hover:bg-[#fef0c0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                        Generando...
                      </>
                    ) : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe tu propiedad: estado, reformas, orientación, transporte cercano..."
                  rows={4}
                  maxLength={2000}
                  className="w-full border border-[#f4c94a]/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9962a] focus:ring-1 focus:ring-[#c9962a] resize-none"
                />
                {aiError && (
                  <p className="text-amber-700 text-xs mt-1 bg-amber-50 px-2 py-1 rounded">
                    {aiError === 'IA no configurada'
                      ? 'Añade GOOGLE_AI_API_KEY en Vercel para usar esta función'
                      : aiError}
                  </p>
                )}
              </div>

              {/* Fotos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#7a5c1e]">
                    Fotos ({images.length}/10)
                  </label>
                  {compressing && (
                    <span className="text-xs text-[#9c7a3c] flex items-center gap-1">
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                      Optimizando...
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9c7a3c] mb-3">
                  Se convierten a WebP automáticamente · Máx. 15 MB por foto
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleImages(e.target.files)}
                />

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-[#c9962a]') }}
                  onDragLeave={e => e.currentTarget.classList.remove('border-[#c9962a]')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-[#c9962a]'); handleImages(e.dataTransfer.files) }}
                  className="border-2 border-dashed border-[#f4c94a]/60 rounded-xl p-4 transition-all mb-3"
                >
                  {previews.length === 0 ? (
                    <div
                      className="text-center py-6 cursor-pointer hover:bg-[#fef9e8]/50 rounded-lg"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-4xl mb-2">?</div>
                      <p className="text-sm font-medium text-[#7a5c1e]">Arrastra las fotos aqu�</p>
                      <p className="text-xs text-[#9c7a3c] mt-1">o haz clic para seleccionar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[#9c7a3c] mb-2">{images.length} foto{images.length !== 1 ? 's' : ''} a�adida{images.length !== 1 ? 's' : ''}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {previews.map((src, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden bg-[#fef9e8] group" style={{ aspectRatio: '4/3' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); removeImage(i) }}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                              aria-label="Eliminar foto"
                            >�</button>
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 text-[10px] bg-[#c9962a] text-white px-1.5 py-0.5 rounded font-medium">
                                Principal
                              </span>
                            )}
                          </div>
                        ))}
                        {images.length < 10 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border-2 border-dashed border-[#f4c94a] flex flex-col items-center justify-center gap-1 text-[#9c7a3c] text-xs hover:border-[#c9962a] hover:bg-[#fef9e8] transition-all"
                            style={{ aspectRatio: '4/3' }}
                          >
                            <span className="text-2xl leading-none">+</span>
                            <span>A�adir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#f4c94a]/20">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium border border-[#f4c94a]/60 text-[#7a5c1e] hover:bg-[#fef9e8] transition-all ${step === 1 ? 'invisible' : ''}`}
          >
            ← Anterior
          </button>

          {step < 4 ? (
            <button
              onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#c9962a] text-white hover:bg-[#a87a20] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={loading || compressing}
              className="px-8 py-2.5 rounded-lg text-sm font-bold bg-[#c9962a] text-white hover:bg-[#a87a20] transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Publicando...
                </>
              ) : '🚀 Publicar anuncio'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

