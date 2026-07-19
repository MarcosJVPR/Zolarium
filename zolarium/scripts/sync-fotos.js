import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET
const FSQ_API_KEY = process.env.FSQ_API_KEY
if (!SUPABASE_URL || !SUPABASE_SECRET || !FSQ_API_KEY) {
  console.error('Faltan SUPABASE_URL, SUPABASE_SECRET o FSQ_API_KEY')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SUPABASE_SECRET)

const FSQ_BASE = 'https://places-api.foursquare.com'
const FSQ_HEADERS = {
  Authorization: `Bearer ${FSQ_API_KEY}`,
  'X-Places-Api-Version': '2025-06-17',
  accept: 'application/json',
}
const MAX_RUN = 250
const PHOTO_SIZE = '600x400'

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function cleanQuery(title) {
  return String(title)
    .replace(/['"«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function photoUrl(photo) {
  if (!photo?.prefix || !photo?.suffix) return null
  return `${photo.prefix}${PHOTO_SIZE}${photo.suffix}`
}

async function fsqFetch(url) {
  const res = await fetch(url, { headers: FSQ_HEADERS })
  if (res.status === 401 || res.status === 403) {
    const body = await res.text()
    console.error(`\n⛔ Foursquare rechazó la key (HTTP ${res.status}).`)
    console.error('Revisa que FSQ_API_KEY sea una Service Key del proyecto en foursquare.com/developers')
    console.error(body.slice(0, 300))
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`   ⚠️ FSQ HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return null
  }
  return res.json()
}

async function findPhoto(plan) {
  const params = new URLSearchParams({
    query: cleanQuery(plan.title),
    ll: `${plan.lat},${plan.lon}`,
    radius: '200',
    limit: '1',
    fields: 'fsq_place_id,name,photos',
  })
  const data = await fsqFetch(`${FSQ_BASE}/places/search?${params}`)
  const place = data?.results?.[0]
  if (!place) return null

  let photo = place.photos?.[0]
  if (!photo && place.fsq_place_id) {
    const photos = await fsqFetch(`${FSQ_BASE}/places/${place.fsq_place_id}/photos?limit=1`)
    photo = Array.isArray(photos) ? photos[0] : photos?.[0]
  }
  return photoUrl(photo)
}

async function main() {
  console.log('📸 Zolarium sync fotos — Foursquare Places')

  const { data: rows, error } = await db
    .from('plans')
    .select('id, title, lat, lon')
    .is('image_url', null)
    .is('event_date', null)
    .not('lat', 'is', null)
    .limit(MAX_RUN)

  if (error) {
    console.error('Supabase:', error.message)
    process.exit(1)
  }
  if (!rows?.length) {
    console.log('Nada pendiente: todos los sitios ya tienen foto o no hay sitios.')
    return
  }
  console.log(`Sitios sin foto: ${rows.length} (procesando hasta ${MAX_RUN} por ejecución)`)

  let found = 0
  let miss = 0
  for (const [i, plan] of rows.entries()) {
    try {
      const url = await findPhoto(plan)
      if (url) {
        const { error: upErr } = await db.from('plans').update({ image_url: url }).eq('id', plan.id)
        if (!upErr) found += 1
      } else {
        miss += 1
      }
    } catch (e) {
      console.error(`   ⚠️ ${plan.title}: ${e.message}`)
      miss += 1
    }
    if ((i + 1) % 25 === 0) console.log(`   ...${i + 1}/${rows.length} (fotos: ${found})`)
    await sleep(250)
  }

  console.log(`\n🎉 Fotos guardadas: ${found} · Sin match en Foursquare: ${miss}`)
  console.log('Recuerda: las fotos de Foursquare requieren atribución en la app (pendiente añadir "📷 Foursquare" en las cards).')
}

main()
