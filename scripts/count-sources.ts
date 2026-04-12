import { createClient } from '@supabase/supabase-js'
const sb = createClient('https://ktsdxpmaljiyuwimcugx.supabase.co', process.env.SUPABASE_SERVICE_KEY!)

async function run() {
  const portals = ['pisos.com','tucasa','fotocasa','idealista','solvia.es','tecnocasa','mvl-gen']
  for (const p of portals) {
    const {count} = await sb.from('listings').select('id',{count:'exact',head:true}).eq('status','published').eq('source_portal',p)
    if (count) console.log(p+':', count)
  }
  const {count:nullCount} = await sb.from('listings').select('id',{count:'exact',head:true}).eq('status','published').is('source_portal',null)
  console.log('null source_portal:', nullCount)
  const {count:total} = await sb.from('listings').select('id',{count:'exact',head:true}).eq('status','published')
  console.log('TOTAL published:', total)
}
run()
