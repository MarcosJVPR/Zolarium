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

const FALLBACK_BY_ELEMENT = {
  fuego: 'deporte',
  tierra: 'naturaleza-paseos',
  aire: 'conferencias',
  agua: 'musica',
}

function detectCategory(text, element) {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category
  }
  return FALLBACK_BY_ELEMENT[element] || 'exposiciones'
}

async function main() {
  console.log('Zolarium retag — UPDATE solo vectores y features')

  let from = 0
  const pageSize = 1000
  let updated = 0
  let page = 0

  for (;;) {
    const { data: plans, error } = await db
      .from('plans')
      .select('id, title, description, element, subcats')
      .not('title', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) { console.error('Error:', error.message); process.exit(1) }
    if (!plans || !plans.length) break
    page += 1
    console.log(`Página ${page}: ${plans.length} planes`)

    for (const p of plans) {
      const text = `${p.title || ''} ${p.description || ''}`
      const category = detectCategory(text, p.element)
      const type = (p.subcats && p.subcats[0]) || 'evento'
      const vector = computePlanArchetypeVector({ subcats: [category], title: p.title, description: p.description })
      const practical = derivePracticalFeatures({ title: p.title, description: p.description, isFree: false })

      const { error: upErr } = await db
        .from('plans')
        .update({
          subcats: [type, category],
          archetype_vector: vectorToArray(vector),
          price_tier: practical.price_tier,
          indoor: practical.indoor,
          time_slot: practical.time_slot,
          social_energy: practical.social_energy,
          intensity: practical.intensity,
        })
        .eq('id', p.id)

      if (!upErr) updated += 1
    }

    if (plans.length < pageSize) break
    from += pageSize
  }

  const { count: tagged } = await db
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .not('archetype_vector', 'is', null)

  console.log(`Actualizados: ${updated} | Con vector: ${tagged}`)
}

main()
