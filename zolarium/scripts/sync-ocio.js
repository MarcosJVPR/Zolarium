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

const CAP_PER_CATEGORY = 50
const EXCLUDED_CATEGORIES = new Set(['infantil-familiar'])

const QUERY_OCIO = `
[out:json][timeout:120];
area["wikidata"="Q2807"]->.mad;
(
  nwr["leisure"~"escape_game|bowling_alley|amusement_arcade|trampoline_park|miniature_golf|ice_rink|water_park|adult_gaming_centre|dance|fitness_centre|garden"](area.mad);
  nwr["sport"~"laser_tag|karting|climbing|paintball|bowling|boxing|martial_arts|surfing|skateboard|archery"](area.mad);
  nwr["amenity"~"karaoke_box|planetarium|cinema|theatre|arts_centre|nightclub|social_centre|community_centre|library"]["name"](area.mad);
  nwr["karaoke"="yes"]["name"](area.mad);
  nwr["tourism"~"gallery|museum|aquarium|viewpoint"]["name"](area.mad);
  nwr["healthcare:speciality"~"acupuncture"]["name"](area.mad);
  nwr["shop"="massage"]["name"](area.mad);
);
out center tags;
`

const QUERY_TIENDAS = `
[out:json][timeout:120];
area["wikidata"="Q2807"]->.mad;
(
  nwr["shop"~"games|books|art|music|craft|confectionery|chocolate|tea|florist|esoteric|herbalist"]["name"](area.mad);
  nwr["cafe"~"board_game|cat|book"]["name"](area.mad);
  nwr["amenity"="cafe"]["cuisine"~"coffee_shop|tea|dessert"]["name"](area.mad);
  nwr["amenity"="restaurant"]["cuisine"~"fine_dining|tapas|vegan|vegetarian"]["name"](area.mad);
);
out center tags;
`

const TAG_LABELS = [
  ['escape_game', 'Escape room', '🔐', 'ocio-urbano'],
  ['laser_tag', 'Laser tag', '🔫', 'ocio-urbano'],
  ['paintball', 'Paintball', '🎯', 'deporte'],
  ['karting', 'Karting', '🏎️', 'deporte'],
  ['climbing', 'Escalada', '🧗', 'deporte'],
  ['boxing', 'Boxeo', '🥊', 'deporte'],
  ['martial_arts', 'Artes marciales', '🥋', 'deporte'],
  ['surfing', 'Surf', '🏄', 'deporte'],
  ['skateboard', 'Skate', '🛹', 'deporte'],
  ['archery', 'Tiro con arco', '🏹', 'deporte'],
  ['fitness_centre', 'Gimnasio', '💪', 'deporte'],
  ['bowling', 'Bolos', '🎳', 'ocio-urbano'],
  ['amusement_arcade', 'Recreativos y arcade', '🕹️', 'ocio-urbano'],
  ['adult_gaming_centre', 'Gaming y VR', '🎮', 'ocio-urbano'],
  ['trampoline_park', 'Camas elásticas', '🤸', 'ocio-urbano'],
  ['miniature_golf', 'Minigolf', '⛳', 'ocio-urbano'],
  ['ice_rink', 'Pista de hielo', '⛸️', 'ocio-urbano'],
  ['water_park', 'Parque acuático', '💦', 'ocio-urbano'],
  ['karaoke', 'Karaoke', '🎤', 'ocio-urbano'],
  ['nightclub', 'Sala y club nocturno', '🪩', 'ocio-urbano'],
  ['dance', 'Sala de baile', '💃', 'teatro-danza'],
  ['theatre', 'Teatro', '🎭', 'teatro-danza'],
  ['arts_centre', 'Centro de arte', '🎨', 'exposiciones'],
  ['gallery', 'Galería de arte', '🖼️', 'exposiciones'],
  ['museum', 'Museo', '🏛️', 'monumentos'],
  ['aquarium', 'Acuario', '🐠', 'naturaleza-paseos'],
  ['viewpoint', 'Mirador', '🌆', 'naturaleza-paseos'],
  ['garden', 'Jardín', '🌷', 'naturaleza-paseos'],
  ['planetarium', 'Planetario', '🪐', 'conferencias'],
  ['cinema', 'Cine', '🎬', 'cine'],
  ['library', 'Biblioteca', '📚', 'conferencias'],
  ['social_centre', 'Centro social', '🫂', 'conferencias'],
  ['community_centre', 'Centro cultural', '🎪', 'conferencias'],
  ['games', 'Juegos de mesa', '🎲', 'ocio-urbano'],
  ['books', 'Librería', '📖', 'conferencias'],
  ['art', 'Tienda de arte', '🎨', 'talleres'],
  ['music', 'Tienda de música', '🎵', 'musica'],
  ['craft', 'Taller artesano', '🧵', 'talleres'],
  ['confectionery', 'Pastelería', '🧁', 'mercadillos'],
  ['chocolate', 'Chocolatería', '🍫', 'mercadillos'],
  ['tea', 'Salón de té', '🍵', 'mercadillos'],
  ['florist', 'Floristería', '🌸', 'talleres'],
  ['fine_dining', 'Alta cocina', '🍽️', 'mercadillos'],
  ['tapas', 'Ruta de tapas', '🍤', 'mercadillos'],
  ['vegan', 'Restaurante vegano', '🥗', 'mercadillos'],
  ['vegetarian', 'Restaurante vegetariano', '🥗', 'mercadillos'],
  ['coffee_shop', 'Café con encanto', '☕', 'mercadillos'],
  ['dessert', 'Postres', '🍰', 'mercadillos'],
  ['massage', 'Masajes', '💆', 'acupuntura'],
  ['esoteric', 'Tienda esotérica y tarot', '🔮', 'esoterico'],
  ['herbalist', 'Herbolario', '🌿', 'esoterico'],
  ['acupuncture', 'Acupuntura', '🪡', 'acupuntura'],
]

const ELEMENT_BY_CATEGORY = {
  deporte: 'fuego', 'ocio-urbano': 'fuego', 'fiestas-populares': 'fuego',
  talleres: 'tierra', mercadillos: 'tierra', 'naturaleza-paseos': 'tierra', monumentos: 'tierra',
  conferencias: 'aire', 'teatro-danza': 'aire', exposiciones: 'aire',
  cine: 'agua', musica: 'agua', esoterico: 'agua', acupuntura: 'agua',
}

const INTENSITY_BY_CATEGORY = {
  deporte: 'activo', 'ocio-urbano': 'activo', 'teatro-danza': 'medio', musica: 'medio',
  mercadillos: 'medio', 'naturaleza-paseos': 'medio',
}

const SOCIAL_BY_CATEGORY = {
  'ocio-urbano': 'grupo', deporte: 'grupo', 'teatro-danza': 'grupo',
  esoterico: 'solitario', acupuntura: 'solitario',
}

function describe(tags) {
  const raw = [
    tags.leisure, tags.sport, tags.amenity, tags.shop, tags.tourism, tags.cuisine,
    tags['healthcare:speciality'], tags.karaoke === 'yes' ? 'karaoke' : '',
  ].filter(Boolean).join(' ')
  for (const [key, label, emoji, category] of TAG_LABELS) {
    if (raw.includes(key)) return { key, label, emoji, category }
  }
  return { key: 'ocio', label: 'Ocio urbano', emoji: '🎯', category: 'ocio-urbano' }
}

function describeText(category, label) {
  if (category === 'esoterico') return `${label} en Madrid. Un rincón para lo místico: tarot, astrología y guía espiritual.`
  if (category === 'acupuntura') return `${label} en Madrid. Bienestar y equilibrio para cuerpo y mente.`
  if (category === 'deporte') return `${label} en Madrid. Adrenalina y movimiento para quemar energía.`
  if (category === 'mercadillos') return `${label} en Madrid. Un placer para los sentidos y el paladar.`
  if (category === 'teatro-danza') return `${label} en Madrid. Escenario, cuerpo y expresión en vivo.`
  if (category === 'exposiciones') return `${label} en Madrid. Arte y mirada para perderse un rato.`
  if (category === 'conferencias') return `${label} en Madrid. Ideas, palabras y curiosidad compartida.`
  if (category === 'naturaleza-paseos') return `${label} en Madrid. Aire libre y calma lejos del asfalto.`
  return `${label} en Madrid. Plan urbano para quedar con gente o desconectar.`
}

function addressOf(tags) {
  const street = tags['addr:street']
  const num = tags['addr:housenumber']
  if (street) return num ? `${street}, ${num}` : street
  return null
}

function qualityScore(tags) {
  let s = 0
  if (tags.website || tags['contact:website'] || tags.url) s += 100
  if (tags.wikidata || tags.wikipedia) s += 80
  if (tags.phone || tags['contact:phone']) s += 40
  if (tags['addr:street'] && tags['addr:housenumber']) s += 30
  if (tags.opening_hours) s += 25
  if (tags['contact:instagram'] || tags['contact:facebook']) s += 15
  if (tags.description) s += 15
  s += Math.min(Object.keys(tags).length, 20)
  return s
}

async function fetchOverpass(query, label) {
  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Zolarium/1.0 (https://zolarium.vercel.app)',
        },
        body: 'data=' + encodeURIComponent(query),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.remark && /timed out|error/i.test(data.remark)) {
          console.error(`   ⚠️ ${label} @ ${url}: ${data.remark}`)
          continue
        }
        console.log(`   ✅ ${label} @ ${url}: ${(data.elements || []).length} elementos`)
        return data.elements || []
      }
      console.error(`   ⚠️ ${label} @ ${url}: HTTP ${res.status}`)
    } catch (e) {
      console.error(`   ⚠️ ${label} @ ${url}: ${e.message}`)
    }
  }
  return []
}

async function main() {
  console.log('Zolarium sync ocio urbano v5 — OpenStreetMap (ODbL)')

  const elements = []
  console.log('📡 Tanda 1: ocio, deporte, cultura')
  elements.push(...await fetchOverpass(QUERY_OCIO, 'ocio'))
  console.log('📡 Tanda 2: tiendas, cafés, gastronomía')
  elements.push(...await fetchOverpass(QUERY_TIENDAS, 'tiendas'))

  console.log(`Recibidos en total: ${elements.length}`)
  if (!elements.length) {
    console.error('Sin resultados de ninguna tanda. Aborta.')
    process.exit(1)
  }

  const seen = new Set()
  const byCategory = {}
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

    const { label, emoji, category } = describe(tags)
    if (EXCLUDED_CATEGORIES.has(category)) continue

    const candidate = { el, tags, name, lat, lon, label, emoji, category, score: qualityScore(tags) }
    ;(byCategory[category] ||= []).push(candidate)
  }

  const rows = []
  const report = []
  for (const [category, list] of Object.entries(byCategory)) {
    list.sort((a, b) => b.score - a.score)
    const top = list.slice(0, CAP_PER_CATEGORY)
    report.push(`${category}: ${top.length}/${list.length}`)
    for (const c of top) {
      const description = describeText(c.category, c.label)
      const vector = computePlanArchetypeVector({ subcats: [c.category], title: c.name, description })
      const practical = derivePracticalFeatures({ title: c.name, description, isFree: false })
      rows.push({
        source_id: `osm-${c.el.type}-${c.el.id}`,
        title: c.name.slice(0, 140),
        description,
        element: ELEMENT_BY_CATEGORY[c.category] || 'aire',
        subcats: ['lugar', c.category],
        archetype_vector: vectorToArray(vector),
        price_tier: practical.price_tier,
        indoor: practical.indoor,
        time_slot: practical.time_slot,
        social_energy: SOCIAL_BY_CATEGORY[c.category] || practical.social_energy,
        intensity: INTENSITY_BY_CATEGORY[c.category] || practical.intensity,
        event_date: null,
        neighborhood: c.tags['addr:suburb'] || c.tags['addr:district'] || null,
        address: addressOf(c.tags),
        lat: c.lat,
        lon: c.lon,
        emoji: c.emoji,
        source: 'openstreetmap.org',
        source_updated_at: new Date().toISOString(),
      })
    }
  }

  console.log('Reparto tras cupo (guardados/disponibles):')
  report.sort().forEach(r => console.log('   ' + r))

  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error, count } = await db
      .from('plans')
      .upsert(batch, { onConflict: 'source_id', count: 'exact' })
    if (error) console.error('Upsert:', error.message)
    else ok += count ?? batch.length
  }
  console.log(`Guardados: ${ok} sitios (tope ${CAP_PER_CATEGORY}/categoría)`)
}

main()
