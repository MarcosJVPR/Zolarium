import { SIGNS, ELEMENT_OPPOSITE } from './zodiac'
import { PLANS } from '../data/plans'
import { getInteractions } from './storage'

export function getDeck(sign, mode = 'planes') {
  const { liked, dislikes, blocked } = getInteractions()
  const element = SIGNS[sign].element
  const today = new Date().toISOString().slice(0, 10)

  const active = PLANS.filter(
    p => p.date >= today && !blocked.includes(p.id) && !liked.includes(p.id)
  )

  let pool
  if (mode === 'diferentes') {
    pool = active.filter(p => p.element === ELEMENT_OPPOSITE[element])
  } else {
    pool = active.filter(p => p.element === element)
    const shadow = active.filter(p => p.element === ELEMENT_OPPOSITE[element])
    pool = [...pool, ...shadow.slice(0, Math.ceil(pool.length * 0.25))]
  }

  return pool.sort((a, b) => {
    const scoreA = (a.stats[sign] || 50) - (dislikes[a.id] || 0) * 30
    const scoreB = (b.stats[sign] || 50) - (dislikes[b.id] || 0) * 30
    return scoreB - scoreA
  })
}

export function getSaved() {
  const { liked } = getInteractions()
  return PLANS.filter(p => liked.includes(p.id))
}
