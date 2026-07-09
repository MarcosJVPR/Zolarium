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

const DATASETS = [
  { slug: '206974-0-agenda-eventos-culturales-100', type: 'evento', fallbackCategory: 'exposiciones', fallbackElement: 'aire' },
  { slug: '300107-0-agenda-actividades-eventos', type: 'evento', fallbackCategory: 'talleres', fallbackElement: 'aire' },
  { slug: '206717-0-agenda-eventos-bibliotecas', type: 'evento', fallbackCategory: 'conferencias', fallbackElement: 'aire' },
  { slug: '300356-0-monumentos-ciudad-madrid', type: 'lugar', fallbackCategory: 'monumentos', fallbackElement: 'aire' },
  { slug: '200761-0-parques-jardines', type: 'lugar', fallbackCategory: 'naturaleza-paseos', fallbackElement: 'tierra' },
  { slug: '202105-0-mercadillos', type: 'lugar', fallbackCategory: 'mercadillos', fallbackElement: 'tierra' },
  { slug: '209426-0-templos-catolicas', type: 'lugar', fallbackCategory: 'templos', fallbackElement: 'agua' },
]

const CATEGORY_PATTERNS = [
  { pattern: /concierto|m[úu]sica|banda|coral|[óo]pera|recital|dj\b/i, category: 'musica' },
  { pattern: /teatro|danza|ballet|performance|escena/i, category: 'teatro-danza' },
  { pattern: /cine|pel[íi]cula|proyecci[óo]n|documental|cortometraje/i, category: 'cine' },
  { pattern: /conferencia|charla|debate|tertulia|seminario|presentaci[óo]n de(l)? libro|club de lectura/i, category: 'conferencias' },
  { pattern: /taller|curso|manualidades|artesan[íi]a|cer[áa]mica|costura|cocina/i, category: 'talleres' },
  { pattern: /deporte|carrera|torneo|competici[óo]n|patinaje|ciclismo|atletismo|f[úu]tbol|baloncesto|zumba|yoga/i, category: 'deporte' },
  { pattern: /exposici[óo]n|muestra|pintura|fotograf[íi]a|escultura|galer[íi]a/i, category: 'exposiciones' },
  { pattern: /fiesta|festival|verbena|carnaval|navidad|cabalgata/i, category: 'fiestas-populares' },
  { pattern: /infantil|familiar|ni[ñn]os|cuentacuentos|t[íi]teres/i, category: 'infantil-familiar' },
  { pattern: /parque|jard[íi]n|senderismo|paseo|naturaleza|bot[áa]nico|huerto/i, category: 'naturaleza-paseos' },
  { pattern: /mercadillo|mercado|rastro/i, category: 'mercadillos' },
  { pattern: /templo|iglesia|catedral|ermita|bas[íi]lica/i, category: 'templos' },
  { pattern: /monumento|estatua|palacio|puerta de|muralla/i, category: 'monumentos' },
]

const ELEMENT_KEYWORDS = {
  fuego: ['deporte', 'carrera', 'aventura', 'festival', 'baile', 'fiesta', 'torneo', 'competición'],
  tierra: ['taller', 'gastronomía', 'cocina', 'mercado', 'huerto', 'jardín', 'artesanía', 'parque', 'yoga'],
  aire: ['conferencia', 'charla', 'debate', 'libro', 'biblioteca', 'ciencia', 'teatro', 'museo', 'curso'],
  agua: ['cine', 'concierto', 'música', 'poesía', 'arte', 'exposición', 'danza', 'meditación', 'templo'],
}

const EMOJIS = {
  fuego: '🔥', tierra: '🌿', aire: '💨', agua: '💧',
  cine: '🎬', concierto: '🎵', música: '🎵', teatro: '🎭', libro: '📚',
  biblioteca: '📚', taller: '🛠️', mercado: '🧺', parque: '🌳', museo: '🏛️',
  deporte: '🏃', exposición: '🎨', templo: '⛪', monumento: '🗿',
}

function detectCategory(text, fallback) {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category
  }
  return fallback
}

function classifyElement(text, fallback) {
  const t = text.toLowerCase()
  let best = fallback
  let bestScore = 0
  for (const [element, words] of Object.entries(ELEMENT_KEYWORDS)) {
    const score = words.filter(w => t.includes(w)).length
    if (score > bestScore) { bestScore = score; best = element }
  }
  return best
}

function pickEmoji(text, element) {
  const t = text.toLowerCase()
  for (const [word, emoji] of Object.entries(EMOJIS)) {
    if (t.includes(word)) return emoji
  }
  return EMOJIS[element]
}

function clean(str, max = 300) {
  if (!str) return null
  return String(str).replace(/\s+/g, ' ').trim().slice(0, max)
}

async function syncDataset({ slug, type, fallbackCategory, fallbackElement }) {
  const url = `https://datos.madrid.es/egob/catalogo/${slug}.json`
  console.log(`\n📡 ${slug}`)

  let data
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data = await res.json()
  } catch (e) {
    console.error(`   ⚠️ Error descargando: ${e.message}`)
    return { ok: 0 }
  }

  const items = data['@graph'] || []
  const today = new Date().toISOString().slice(0, 10)
  const rows = []

  for (const item of items) {
    const title = clean(item.title, 140)
    if (!title) continue

    let eventDate = null
    if (type === 'evento') {
      eventDate = (item.dtstart || '').slice(0, 10) || null
      if (!eventDate || eventDate < today) continue
    }

    const description = clean(item.description || item['organization']?.['organization-desc'], 280)
    const text = `${title} ${description || ''}`
    const category = detectCategory(text, fallbackCategory)
    const element = classifyElement(text, fallbackElement)

    const archetypeVector = computePlanArchetypeVector({
      subcats: [category], title, description,
    })
    const practical = derivePracticalFeatures({ title, description, isFree: false })

    rows.push({
      source_id: String(item.id || item['@id'] || `${slug}-${title}`),
      title,
      description,
      element,
      subcats: [type, category],
      archetype_vector: vectorToArray(archetypeVector),
      price_tier: practical.price_tier,
      indoor: practical.indoor,
      time_slot: practical.time_slot,
      social_energy: practical.social_energy,
      intensity: practical.intensity,
      event_date: eventDate,
      neighborhood: clean(item.address?.district?.['@id']?.split('/').pop()?.replaceAll('-', ' '), 60),
      address: clean(item.address?.['street-address'] || item.address?.locality, 140),
      lat: item.location?.latitude || null,
      lon: item.location?.longitude || null,
      emoji: pickEmoji(text, element),
      source: 'datos.madrid.es',
      source_updated_at: new Date().toISOString(),
    })
  }

  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error, count } = await db
      .from('plans')
      .upsert(batch, { onConflict: 'source_id', count: 'exact' })
    if (error) console.error(`   ⚠️ Upsert: ${error.message}`)
    else ok += count ?? batch.length
  }

  console.log(`   ✅ ${ok} planes (de ${items.length} registros)`)
  return { ok }
}

async function main() {
  console.log('🌟 Zolarium sync v2 — datos.madrid.es (CC BY 4.0)')
  for (const ds of DATASETS) await syncDataset(ds)

  const { count: total } = await db.from('plans').select('*', { count: 'exact', head: true })
  const { count: tagged } = await db
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .not('archetype_vector', 'is', null)

  console.log(`\n🎉 Total: ${total} | Con vector arquetípico: ${tagged}`)
}

main()
