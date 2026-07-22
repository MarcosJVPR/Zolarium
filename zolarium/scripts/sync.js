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
  { slug: '202105-0-mercadillos', type: 'lugar', fallbackCategory: 'mercadillos', fallbackElement: 'tierra' },
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

const ENTITIES = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', iexcl: '¡', iquest: '¿', ordf: 'ª', ordm: 'º', nbsp: ' ' }

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITIES[name] ?? m)
}

function clean(str, max = 300) {
  if (!str) return null
  return decodeEntities(decodeEntities(String(str))).replace(/\s+/g, ' ').trim().slice(0, max)
}

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Zolarium/1.0 (https://zolarium.vercel.app)' } })
  } finally {
    clearTimeout(t)
  }
}

function extractOgImage(html) {
  const m =
    html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (!m) return null
  const url = m[1].trim()
  if (!/^https?:\/\//.test(url)) return null
  return url.slice(0, 500)
}

async function scrapeImages(queue) {
  if (!queue.length) {
    console.log('🖼️ Sin páginas nuevas que rastrear')
    return
  }
  console.log(`🖼️ Buscando og:image en ${queue.length} páginas...`)
  let found = 0
  const CONCURRENCY = 5
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async item => {
      try {
        const res = await fetchWithTimeout(item.url)
        if (!res.ok) return
        const html = (await res.text()).slice(0, 400000)
        const img = extractOgImage(html)
        if (!img) return
        const { error } = await db.from('plans').update({ image_url: img }).eq('source_id', item.source_id)
        if (!error) found += 1
      } catch { }
    }))
    if (i % 100 === 0 && i > 0) console.log(`   ...${i}/${queue.length}`)
  }
  console.log(`🖼️ Imágenes guardadas: ${found}`)
}

async function syncDataset({ slug, type, fallbackCategory, fallbackElement }, imageQueue, existingImages) {
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

    const sourceId = String(item.id || item['@id'] || `${slug}-${title}`)
    const pageUrl = typeof item.link === 'string' ? item.link : null
    if (pageUrl && /^https?:\/\//.test(pageUrl) && !existingImages.has(sourceId)) {
      imageQueue.push({ source_id: sourceId, url: pageUrl })
    }

    rows.push({
      source_id: sourceId,
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
  const byTitle = new Map()
  for (const r of rows) {
    const k = r.title.toLowerCase()
    const prev = byTitle.get(k)
    if (!prev || (r.event_date || '9999') < (prev.event_date || '9999')) byTitle.set(k, r)
  }
  const deduped = [...byTitle.values()]
  for (let i = 0; i < deduped.length; i += 200) {
    const batch = deduped.slice(i, i + 200)
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
  console.log('🌟 Zolarium sync v3 — datos.madrid.es (CC BY 4.0) + og:image')

  const existingImages = new Set()
  let from = 0
  for (;;) {
    const { data, error } = await db
      .from('plans')
      .select('source_id')
      .not('image_url', 'is', null)
      .range(from, from + 999)
    if (error || !data?.length) break
    for (const r of data) existingImages.add(r.source_id)
    if (data.length < 1000) break
    from += 1000
  }
  console.log(`🖼️ Ya con imagen: ${existingImages.size}`)

  const imageQueue = []
  for (const ds of DATASETS) await syncDataset(ds, imageQueue, existingImages)

  await scrapeImages(imageQueue)

  const { count: total } = await db.from('plans').select('*', { count: 'exact', head: true })
  const { count: tagged } = await db
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .not('archetype_vector', 'is', null)
  const { count: withImage } = await db
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .not('image_url', 'is', null)

  console.log(`\n🎉 Total: ${total} | Con vector: ${tagged} | Con foto: ${withImage}`)
}

main()
