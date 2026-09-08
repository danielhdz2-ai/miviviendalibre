/**
 * 🔍 Script de Indexación Manual en Google Search Console
 * 
 * Genera una lista de las 50 URLs prioritarias para solicitar indexación manual
 * en Google Search Console
 * 
 * Criterios de prioridad:
 * 1. Ciudades con mayor demanda (Barcelona, Madrid, Valencia)
 * 2. Operación: alquiler > venta (más búsquedas)
 * 3. Precio competitivo (vs media del mercado)
 * 4. Listings más recientes
 * 
 * Uso: npx tsx scripts/seo/generate-priority-urls-gsc.mts
 * 
 * Luego en Google Search Console:
 * 1. Ir a "Inspección de URLs"
 * 2. Pegar cada URL
 * 3. Clic en "Solicitar indexación"
 * 
 * ⚠️ Límite: Google permite ~10-20 solicitudes/día
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = 'https://inmonest.com'

// Ciudades prioritarias (ordenadas por volumen de búsquedas)
const PRIORITY_CITIES = [
  'barcelona',
  'madrid',
  'valencia',
  'sevilla',
  'málaga',
  'malaga',
  'bilbao',
  'zaragoza',
]

async function main() {
  console.log('🔍 Generador de URLs Prioritarias para GSC')
  console.log('=========================================\n')
  
  // Obtener listings premium ordenados por prioridad
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, city, operation, price_eur, created_at')
    .eq('status', 'published')
    .eq('has_images', true)
    .order('ranking_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(500)
  
  if (error || !listings) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`📊 Total listings premium: ${listings.length}`)
  
  // Calcular score de prioridad para cada listing
  const scored = listings.map(l => {
    let score = 0
    
    // +10 puntos por ciudad prioritaria (posición en array)
    const cityIndex = PRIORITY_CITIES.findIndex(c => 
      l.city.toLowerCase().includes(c) || c.includes(l.city.toLowerCase())
    )
    if (cityIndex >= 0) {
      score += (PRIORITY_CITIES.length - cityIndex) * 10
    }
    
    // +5 puntos si es alquiler (más búsquedas)
    if (l.operation === 'rent') score += 5
    
    // +3 puntos por recencia (últimos 30 días)
    const daysOld = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld < 30) score += 3
    if (daysOld < 7) score += 2
    
    return { ...l, score }
  })
  
  // Ordenar por score descendente y tomar top 50
  const top50 = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
  
  // Generar archivo de URLs
  const urls = top50.map(l => `${BASE_URL}/pisos/${l.id}`)
  const urlsText = urls.join('\n')
  
  fs.mkdirSync('scripts/seo/exports', { recursive: true })
  fs.writeFileSync('scripts/seo/exports/urls-prioritarias.txt', urlsText)
  
  console.log('\n📋 TOP 50 URLS PRIORITARIAS')
  console.log('===========================\n')
  
  top50.forEach((l, i) => {
    console.log(`${i + 1}. [Score: ${l.score}] ${l.city} - ${l.operation}`)
    console.log(`   ${BASE_URL}/pisos/${l.id}`)
    console.log(`   ${l.title.slice(0, 60)}...\n`)
  })
  
  console.log('\n✅ Archivo generado: scripts/seo/exports/urls-prioritarias.txt')
  console.log('\n📝 INSTRUCCIONES:')
  console.log('1. Abre Google Search Console: https://search.google.com/search-console')
  console.log('2. Ve a "Inspección de URLs"')
  console.log('3. Pega cada URL y solicita indexación')
  console.log('4. ⚠️  Límite: ~10-20 URLs por día')
  console.log('5. Repite durante 3-5 días para completar las 50 URLs')
  
  // También generar CSV para importar a sheets
  const csv = ['URL,Ciudad,Operación,Score'].concat(
    top50.map(l => `${BASE_URL}/pisos/${l.id},${l.city},${l.operation},${l.score}`)
  ).join('\n')
  
  fs.writeFileSync('scripts/seo/exports/urls-prioritarias.csv', csv)
  console.log('\n✅ CSV generado: scripts/seo/exports/urls-prioritarias.csv')
  
  // Estadísticas por ciudad
  console.log('\n📊 DISTRIBUCIÓN POR CIUDAD')
  console.log('==========================')
  const byCityMap = new Map<string, number>()
  top50.forEach(l => {
    byCityMap.set(l.city, (byCityMap.get(l.city) || 0) + 1)
  })
  Array.from(byCityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`${city}: ${count} URLs`)
    })
}

main().catch(console.error)
