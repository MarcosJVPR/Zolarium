import { createClient } from '@supabase/supabase-js'
import { computePlanArchetypeVector, derivePracticalFeatures } from '../src/engine/tagging.js'
import { vectorToArray } from '../src/engine/archetype.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET
if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SECRET')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SUPABASE_SECRET)

const QUERY = `
[out:json][timeout:180];
area["wikidata"="Q2807"]->.mad;
(
  nwr["leisure"~"escape_game|bowling_alley|amusement_arcade|trampoline_park|miniature_golf|ice_rink"](area.mad);
  nwr["sport"~"laser_tag|karting|climbing|paintball|bowling"](area.mad);
  nwr["amenity"~"karaoke_box|planetarium|cinema"]["name"](area.mad);
  nwr["leisure"="sports_centre"]["sport"~"climbing|karting|laser_tag"](area.mad);
  nwr["shop"="games"]["name"](area.mad);
  nwr["cafe"~"board_game|cat|book"]["name"](area.mad);
  nwr["cuisine"~"board_game"]["name"](area.mad);
  nwr["leisure"="adult_gaming_centre"]["name"](area.mad);
);
out center tags;
`

const TAG_LABELS = [
  ['escape_game', 'Escape room', '🔐'],
  ['laser_tag', 'Laser tag', '🔫'],
  ['bowling', 'Bolos', '🎳'],
  ['amusement_arcade', 'Recreativos y arcade', '🕹️'],
  ['trampoline_park', 'Parque de camas elásticas', '🤸'],
  ['miniature_golf', 'Minigolf', '⛳'],
  ['ice_rink', 'Pista de hielo', '⛸️'],
  ['karting', 'Karting', '🏎️'],
  ['climbing', 'Escalada', '🧗'],
  ['paintball', 'Paintball', '🎯'],
  ['karaoke', 'Karaoke', '🎤'],
  ['planetarium', 'Planetario', '🪐'],
  ['cinema', 'Cine', '🎬'],
  ['games', 'Juegos de mesa', '🎲'],
  ['cafe', 'Café con encanto', '☕'],
  ['adult_gaming_centre', 'Gaming y VR', '🎮'],
]

function describe(tags) {
  const raw = `${tags.leisure || ''} ${tags.sport || ''} ${tags.amenity || ''} ${tags.shop || ''}`
  for (const [key, label, emoji] of TAG_LABELS) {
    if (raw.includes(key)) return { label, emoji }
  }
  return { label: 'Ocio urbano', emoji: '🎯' }
}

function addressOf(tags) {
  const street = tags['addr:street']
  const num = tags['addr:housenumber']
  if (street) return num ? `${street}, ${num}` : street
  return null
}

async function main() {
  console.log('Zolarium sync ocio urbano — OpenStreetMap (ODbL)')
  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]
  let data = null
  for (const url of MIRRORS) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Zolarium/1.0 (https://zolarium.vercel.app)',
      },
      body: 'data=' + encodeURIComponent(QUERY),
    })
    if (res.ok) {
      data = await res.json()
      console.log('Mirror:', url)
      if (data.remark) console.log('Remark:', data.remark)
      break
    }
    const errText = await res.text()
    console.error(`${url} -> HTTP ${res.status}: ${errText.slice(0, 200)}`)
  }
  if (!data) process.exit(1)
  const elements = data.elements || []
  console.log(`Recibidos: ${elements.length}`)

  const seen = new Set()
  const rows = []
  for (const el of elements) {
    const tags = el.tags || {}
    const name = tags.name
    if (!name) continue
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!lat || !lon) continue
    const dedupe = name.toLowerCase().trim()
    if (seen.has(dedupe)) continue
    seen.add(dedupe)

    const { label, emoji } = describe(tags)
    const description = `${label} en Madrid. Plan urbano para quedar con gente o desconectar.`
    const vector = computePlanArchetypeVector({ subcats: ['ocio-urbano'], title: name, description })
    const practical = derivePracticalFeatures({ title: name, description, isFree: false })

    rows.push({
      source_id: `osm-${el.type}-${el.id}`,
      title: name.slice(0, 140),
      description,
      element: 'fuego',
      subcats: ['lugar', 'ocio-urbano'],
      archetype_vector: vectorToArray(vector),
      price_tier: practical.price_tier,
      indoor: practical.indoor,
      time_slot: practical.time_slot,
      social_energy: 'grupo',
      intensity: 'activo',
      event_date: null,
      neighborhood: tags['addr:suburb'] || tags['addr:district'] || null,
      address: addressOf(tags),
      lat,
      lon,
      emoji,
      source: 'openstreetmap.org',
      source_updated_at: new Date().toISOString(),
    })
  }

  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error, count } = await db
      .from('plans')
      .upsert(batch, { onConflict: 'source_id', count: 'exact' })
    if (error) console.error('Upsert:', error.message)
    else ok += count ?? batch.length
  }
  console.log(`Guardados: ${ok} sitios de ocio urbano`)
}

main()
