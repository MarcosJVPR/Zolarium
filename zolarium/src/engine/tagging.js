import {
  CATEGORY_ARCHETYPES, CATEGORY_FALLBACK, KEYWORD_DELTAS, PRACTICAL_KEYWORD_RULES,
} from './config.js'
import { zeroVector, normalize } from './archetype.js'

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}


export function categoryToVector(categoryOrList) {
  const list = Array.isArray(categoryOrList) ? categoryOrList : [categoryOrList]
  const matched = list
    .map(c => (c || '').toLowerCase().trim())
    .map(c => CATEGORY_ARCHETYPES[c])
    .filter(Boolean)

  if (!matched.length) return { ...CATEGORY_FALLBACK }

  const acc = zeroVector()
  for (const vec of matched) {
    for (const [archetype, w] of Object.entries(vec)) acc[archetype] += w
  }
  return acc // se normaliza en computePlanArchetypeVector
}

export function applyKeywordDeltas(vectorObj, text) {
  const clean = stripAccents(text || '')
  const out = { ...vectorObj }
  for (const { pattern, archetype, delta } of KEYWORD_DELTAS) {
    if (pattern.test(clean)) {
      out[archetype] = (out[archetype] || 0) + delta
    }
  }
  return out
}


export function computePlanArchetypeVector({ subcats, category, title, description }) {
  const base = categoryToVector(subcats && subcats.length ? subcats : category)
  const withKeywords = applyKeywordDeltas(base, `${title || ''} ${description || ''}`)
  return normalize(withKeywords)
}


export function derivePracticalFeatures({ title, description, isFree }) {
  const text = stripAccents(`${title || ''} ${description || ''}`)

  const priceRule = PRACTICAL_KEYWORD_RULES.price_tier.find(r => r.pattern.test(text))
  const price_tier = isFree ? 0 : (priceRule ? priceRule.value : 1) // default: se asume de pago

  const indoorRule = PRACTICAL_KEYWORD_RULES.indoor.find(r => r.pattern.test(text))
  const indoor = indoorRule ? indoorRule.value : true // default: interior

  const time_slot = 'tarde'

  const socialRule = PRACTICAL_KEYWORD_RULES.social_energy.find(r => r.pattern.test(text))
  const social_energy = socialRule ? socialRule.value : 'grupo'

  const intensityRule = PRACTICAL_KEYWORD_RULES.intensity.find(r => r.pattern.test(text))
  const intensity = intensityRule ? intensityRule.value : 'medio'

  return { price_tier, indoor, time_slot, social_energy, intensity }
}
