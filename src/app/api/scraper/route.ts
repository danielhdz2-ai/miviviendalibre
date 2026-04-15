/**
 * Vercel Cron endpoint — Scraper boutique diario
 *
 * Cron: cada día a las 7:00 AM (configurado en vercel.json)
 * Seguridad: Vercel envía Authorization: Bearer <CRON_SECRET> automáticamente
 * Timeout: maxDuration = 300s (requiere Vercel Pro)
 *
 * Variables de entorno necesarias en Vercel:
 *   CRON_SECRET          — secreto para autenticar el cron (Vercel lo inyecta solo)
 *   SUPABASE_SERVICE_KEY — service role key de Supabase
 */

import { NextRequest, NextResponse } from 'next/server'

// Vercel Pro: hasta 300 segundos para cron jobs
export const maxDuration = 300

const MAX_ITEMS = 5  // anuncios nuevos máx. por tarea
const MAX_PAGES = 2  // páginas a inspeccionar

export async function GET(request: NextRequest) {
  // ── Autenticación ─────────────────────────────────────────────────────────
  // Vercel Cron inyecta automáticamente: Authorization: Bearer <CRON_SECRET>
  // También se acepta la misma cabecera para pruebas manuales
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY no configurado en Vercel' }, { status: 500 })
  }

  const startedAt = Date.now()
  const results: Record<string, { inserted: number; skipped: number } | { error: string }> = {}

  async function run(label: string, fn: () => Promise<{ inserted: number; skipped: number }>) {
    try {
      console.log(`[cron] ▶ ${label}`)
      const r = await fn()
      results[label] = r
      console.log(`[cron] ✅ ${label}: +${r.inserted}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results[label] = { error: msg }
      console.error(`[cron] ❌ ${label}:`, msg)
    }
  }

  // Importaciones dinámicas — evitan ejecutar código de módulo al arrancar (guards process.argv)
  const { scrapeParticulares } = await import('../../../../scripts/scrapers/pisoscom_particulares')
  const { scrapeMilanuncios }  = await import('../../../../scripts/scrapers/milanuncios')
  const { scrapeSolvia }       = await import('../../../../scripts/scrapers/solvia')
  const { runTucasa }          = await import('../../../../scripts/scrapers/tucasa_standalone')
  const { runEnalquiler }      = await import('../../../../scripts/scrapers/enalquiler')

  // ── pisos.com particulares — alquiler (prioridad máxima) ──────────────────
  await run('pisoscom alquiler madrid',    () => scrapeParticulares('alquiler', 'madrid',    MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)
  await run('pisoscom alquiler barcelona', () => scrapeParticulares('alquiler', 'barcelona', MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)

  // ── pisos.com particulares — venta ────────────────────────────────────────
  await run('pisoscom venta madrid',       () => scrapeParticulares('venta', 'madrid',    MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)
  await run('pisoscom venta barcelona',    () => scrapeParticulares('venta', 'barcelona', MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)

  // ── tucasa ────────────────────────────────────────────────────────────────
  await run('tucasa venta madrid',         () => runTucasa('venta',    'madrid',   MAX_PAGES, MAX_ITEMS))
  await run('tucasa alquiler madrid',      () => runTucasa('alquiler', 'madrid',   MAX_PAGES, MAX_ITEMS))
  await run('tucasa venta valencia',       () => runTucasa('venta',    'valencia', MAX_PAGES, MAX_ITEMS))

  // ── enalquiler (100% particulares, solo alquiler) ─────────────────────────
  await run('enalquiler madrid',           () => runEnalquiler('madrid',    MAX_PAGES, MAX_ITEMS))
  await run('enalquiler barcelona',        () => runEnalquiler('barcelona', MAX_PAGES, MAX_ITEMS))

  // ── milanuncios particulares ──────────────────────────────────────────────
  await run('milanuncios venta madrid',    () => scrapeMilanuncios('venta',    'madrid', MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)
  await run('milanuncios alquiler madrid', () => scrapeMilanuncios('alquiler', 'madrid', MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)

  // ── solvia (bancarios Sabadell) ───────────────────────────────────────────
  await run('solvia venta',                () => scrapeSolvia('venta',    MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)
  await run('solvia alquiler',             () => scrapeSolvia('alquiler', MAX_PAGES, MAX_ITEMS) as Promise<{inserted:number;skipped:number}>)

  const elapsed = Math.round((Date.now() - startedAt) / 1000)
  const totalInserted = Object.values(results).reduce(
    (sum, r) => sum + ('inserted' in r ? r.inserted : 0), 0
  )

  return NextResponse.json({
    ok: true,
    elapsed_s: elapsed,
    total_inserted: totalInserted,
    tasks: Object.keys(results).length,
    results,
  })
}

