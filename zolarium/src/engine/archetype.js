import { ARCHETYPE_KEYS, SIGN_ARCHETYPES, W_POINT, W_POINT_SOLAR_FALLBACK } from './config.js'

export function zeroVector() {
  return Object.fromEntries(ARCHETYPE_KEYS.map(k => [k, 0]))
}

export function normalize(vectorObj) {
  const sum = ARCHETYPE_KEYS.reduce((acc, k) => acc + (vectorObj[k] || 0), 0)
  if (sum <= 0) return zeroVector()
  const out = {}
  for (const k of ARCHETYPE_KEYS) out[k] = (vectorObj[k] || 0) / sum
  return out
}

export function vectorToArray(vectorObj) {
  return ARCHETYPE_KEYS.map(k => vectorObj[k] || 0)
}

export function arrayToVector(arr) {
  const out = {}
  ARCHETYPE_KEYS.forEach((k, i) => { out[k] = arr[i] || 0 })
  return out
}


export function computeBaseVector(chart, weightsOverride) {
  const weights = weightsOverride || (chart.hasTime ? W_POINT : W_POINT_SOLAR_FALLBACK)
  const chartType = chart.hasTime ? 'full' : 'solar'

  const acc = zeroVector()
  for (const point of Object.keys(weights)) {
    const w = weights[point]
    if (!w) continue
    const sign = chart[point]
    const signVector = sign ? SIGN_ARCHETYPES[sign] : null
    if (!signVector) continue
    for (const [archetype, partial] of Object.entries(signVector)) {
      acc[archetype] += w * partial
    }
  }

  return { vector: normalize(acc), chartType }
}


export function dominantElementModality(chart, SIGNS) {
  const points = ['sun', 'moon', 'ascendant']
  const elementScore = {}
  const modalityScore = {}
  for (const point of points) {
    const sign = chart[point]
    if (!sign || !SIGNS[sign]) continue
    const w = W_POINT[point] || 0
    const { element, modality } = SIGNS[sign]
    elementScore[element] = (elementScore[element] || 0) + w
    modalityScore[modality] = (modalityScore[modality] || 0) + w
  }
  const topOf = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return { element: topOf(elementScore), modality: topOf(modalityScore) }
}
