import { ARCHETYPE_KEYS, AGE_BRACKETS, NATAL_BONUS } from './config.js'
import { normalize, vectorToArray, arrayToVector } from './archetype.js'

export function getAge(birthDateStr, atDate = new Date()) {
  const birth = new Date(birthDateStr)
  let age = atDate.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    atDate.getMonth() > birth.getMonth() ||
    (atDate.getMonth() === birth.getMonth() && atDate.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}


export function ageModulatorVector(birthDateStr) {
  const age = getAge(birthDateStr)
  const bracket = AGE_BRACKETS.find(b => age >= b.min && age <= b.max) || null
  const out = Object.fromEntries(ARCHETYPE_KEYS.map(k => [k, 1.0]))
  if (bracket) {
    for (const [archetype, mult] of Object.entries(bracket.mult)) {
      out[archetype] = mult
    }
  }
  return out
}


export function applyNatalBonus(modulatorVector, chart) {
  const out = { ...modulatorVector }
  if (chart.saturn && chart.sun && chart.saturn === chart.sun) {
    const { archetype, mult } = NATAL_BONUS.saturnSameAsSun
    out[archetype] = (out[archetype] || 1) * mult
  }
  if (chart.jupiter && chart.sun && chart.jupiter === chart.sun) {
    const { archetype, mult } = NATAL_BONUS.jupiterSameAsSun
    out[archetype] = (out[archetype] || 1) * mult
  }
  return out
}


export function effectiveVector(baseVector, chart, birthDateStr) {
  const modulator = applyNatalBonus(ageModulatorVector(birthDateStr), chart)
  const acc = {}
  for (const k of ARCHETYPE_KEYS) acc[k] = (baseVector[k] || 0) * (modulator[k] || 1)
  return normalize(acc)
}

export { vectorToArray, arrayToVector }
