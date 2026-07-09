import { ARCHETYPE_KEYS, DECK } from './config.js'

function gaussianNoise(std) {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}


export function weakestArchetypes(effVectorObj, n = DECK.weakestCount) {
  return Object.entries(effVectorObj)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([key]) => ARCHETYPE_KEYS.indexOf(key))
}

function dominantArchetypeIndex(planVectorArr) {
  let best = 0
  for (let i = 1; i < planVectorArr.length; i++) {
    if (planVectorArr[i] > planVectorArr[best]) best = i
  }
  return best
}


export function thompsonSample(scored, count, weakestIdx, noiseStd = DECK.thompsonNoiseStd) {
  const withNoise = scored.map(item => {
    const noisy = item.score.total + gaussianNoise(noiseStd)
    const isShadowMatch = weakestIdx.includes(dominantArchetypeIndex(item.planVectorArr))
    // pequeño empujón si coincide con la sombra, para que "llame" un poco más
    // sin dominar por completo el muestreo (mantiene el espíritu "suave")
    return { ...item, sampled: noisy + (isShadowMatch ? 0.05 : 0) }
  })
  return withNoise.sort((a, b) => b.sampled - a.sampled).slice(0, count)
}

function shuffleInterleave(top, exploration) {
  const result = [...top]
  // inserta cada carta de exploración en una posición aleatoria del deck,
  // nunca todas al final (§5.5)
  for (const card of exploration) {
    const pos = Math.floor(Math.random() * (result.length + 1))
    result.splice(pos, 0, card)
  }
  return result
}


export function buildDeck(candidates, effVectorObj, opts = {}) {
  const size = opts.size ?? DECK.size
  const explorationCount = opts.explorationCount ?? DECK.explorationCount
  const exploitCount = size - explorationCount

  const sorted = [...candidates].sort((a, b) => b.score.total - a.score.total)
  const top = sorted.slice(0, exploitCount)
  const rest = sorted.slice(exploitCount)

  const weakestIdx = weakestArchetypes(effVectorObj)
  const exploration = thompsonSample(rest, explorationCount, weakestIdx)

  return shuffleInterleave(top, exploration).map(({ plan }) => plan)
}
