'use client'

/**
 * useListingCount
 * Cuenta los anuncios que coinciden con los filtros actuales de la URL.
 * Debouncea los cambios 350 ms para no saturar Supabase.
 *
 * USO:
 *   const { count, loading } = useListingCount()
 */

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { applyProFilters, parseProParams } from '@/lib/search-filters'

const DEBOUNCE_MS = 350

export function useListingCount() {
  const sp = useSearchParams()
  const [count, setCount]     = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        let q = supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
          .eq('has_images', true)

        // ── Filtros base (mismos que searchListings en lib/listings.ts) ──
        const operacion = sp.get('operacion')
        const ciudad    = sp.get('ciudad')
        const hab       = sp.get('hab')
        const banos     = sp.get('banos')
        const precioMin = sp.get('precio_min')
        const precioMax = sp.get('precio_max')
        const areaMin   = sp.get('area_min')
        const areaMax   = sp.get('area_max')

        if (operacion) q = q.eq('operation', operacion)
        if (ciudad)    q = q.ilike('city', `%${ciudad}%`)

        if (sp.get('solo_particulares') === 'true') q = q.eq('is_particular', true)
        if (sp.get('solo_bancarias')    === 'true') q = q.eq('is_bank', true)
        if (sp.get('solo_agencias')     === 'true') {
          q = q.eq('is_particular', false).eq('is_bank', false)
        }

        if (hab)       q = q.eq('bedrooms', parseInt(hab, 10))
        if (banos)     q = q.gte('bathrooms', parseInt(banos, 10))
        if (precioMin) q = q.gte('price_eur', parseInt(precioMin, 10))
        if (precioMax) q = q.lte('price_eur', parseInt(precioMax, 10))
        if (areaMin)   q = q.gte('area_m2', parseInt(areaMin, 10))
        if (areaMax)   q = q.lte('area_m2', parseInt(areaMax, 10))

        // ── Filtros pro (features JSONB + fecha) ─────────────────────────
        q = applyProFilters(q, parseProParams({
          estado:     sp.get('estado')     ?? undefined,
          caract:     sp.get('caract')     ?? undefined,
          planta:     sp.get('planta')     ?? undefined,
          energia:    sp.get('energia')    ?? undefined,
          multimedia: sp.get('multimedia') ?? undefined,
          fecha_pub:  sp.get('fecha_pub')  ?? undefined,
        }))

        const { count: n } = await q
        setCount(n ?? 0)
      } catch {
        setCount(null)
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [sp])

  return { count, loading }
}
