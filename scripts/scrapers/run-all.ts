/**
 * Script maestro: lanza todos los scrapers en secuencia
 * 
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts --max 50 --headless false
 */

import { execSync } from 'child_process'

const args = process.argv.slice(2)
const MAX  = args.includes('--max') ? args[args.indexOf('--max') + 1] : '100'
const HL   = args.includes('--headless') ? args[args.indexOf('--headless') + 1] : 'true'

const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_KEY\n  Uso: SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/run-all.ts')
  process.exit(1)
}

const CITIES = ['madrid', 'barcelona', 'valencia', 'sevilla']
const OPERATIONS = ['sale', 'rent'] as const

const jobs: string[] = []

for (const op of OPERATIONS) {
  for (const city of CITIES) {
    // Tecnocasa cubre todas las ciudades
    if (['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'bilbao', 'malaga'].includes(city)) {
      jobs.push(`npx tsx scripts/scrapers/tecnocasa.ts --operation ${op} --city ${city} --max ${MAX} --headless ${HL}`)
    }
    // Redpiso cubre las 4 principales
    jobs.push(`npx tsx scripts/scrapers/redpiso.ts --operation ${op} --city ${city} --max ${MAX} --headless ${HL}`)
  }
}

// Monapart (solo sale/rent, no filtra ciudad)
jobs.push(`npx tsx scripts/scrapers/monapart.ts --operation sale --max ${MAX} --headless ${HL}`)
jobs.push(`npx tsx scripts/scrapers/monapart.ts --operation rent --max ${MAX} --headless ${HL}`)

console.log(`\n🚀 Mi Vivienda Libre — Scraper Maestro`)
console.log(`   ${jobs.length} tareas programadas`)
console.log(`   Máx. por tarea: ${MAX} anuncios\n`)

let totalJobs = 0
let okJobs = 0

for (const job of jobs) {
  totalJobs++
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`[${totalJobs}/${jobs.length}] ${job}`)
  console.log('─'.repeat(60))
  try {
    execSync(job, {
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_SERVICE_KEY: KEY },
    })
    okJobs++
  } catch {
    console.warn(`⚠️  Tarea falló, continuando...`)
  }

  // Pausa entre scrapers para no saturar la IP
  await new Promise(r => setTimeout(r, 3000))
}

console.log(`\n${'═'.repeat(60)}`)
console.log(`✅ Completado: ${okJobs}/${totalJobs} tareas exitosas`)
console.log('═'.repeat(60))
