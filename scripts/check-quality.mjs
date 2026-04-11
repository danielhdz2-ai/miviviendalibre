const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c2R4cG1hbGppeXV3aW1jdWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NDg1NCwiZXhwIjoyMDkxMjMwODU0fQ.0VuUqRsrb2kNgLfoqyduMC7weRc9JJKtg1r14mOEbi8';
const BASE = 'https://ktsdxpmaljiyuwimcugx.supabase.co';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const listings = await fetch(
  BASE + '/rest/v1/listings?select=id,title,bedrooms,bathrooms,area_m2,description&source_portal=eq.pisos.com&order=created_at.desc&limit=3',
  { headers: H }
).then(r => r.json());

for (const l of listings) {
  console.log('\nTITLE:', l.title);
  console.log('ROOMS:', l.bedrooms, '| BATHS:', l.bathrooms, '| AREA:', l.area_m2);
  console.log('DESC len:', l.description ? l.description.length : 0, '|', (l.description || '–').slice(0, 150));
  const imgs = await fetch(
    BASE + '/rest/v1/listing_images?listing_id=eq.' + l.id + '&select=external_url',
    { headers: H }
  ).then(r => r.json());
  console.log('IMAGES:', imgs.length);
  imgs.slice(0, 3).forEach(img => console.log('  ', img.external_url.slice(0, 90)));
}
