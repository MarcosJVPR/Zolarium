import { ARCHETYPE_KEYS } from './config.js'
import { vectorToArray } from './archetype.js'
import {
  SCORE_WEIGHTS, COLD_START_N, CONTEXT, BETA_PRIOR, PRACTICAL_FEATURE_SLOTS,
} from './config.js'

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

export function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * (b[i] || 0)
  return s
}

export function cosineSim(a, b) {
  const dotP = dot(a, b)
  const normA = Math.sqrt(dot(a, a))
  const normB = Math.sqrt(dot(b, b))
  if (normA === 0 || normB === 0) return 0
  return dotP / (normA * normB)
}

export function sNatal(effVectorObj, planVectorArrOrObj) {
  const a = vectorToArray(effVectorObj)
  const b = Array.isArray(planVectorArrOrObj) ? planVectorArrOrObj : vectorToArray(planVectorArrOrObj)
  return Math.max(0, Math.min(1, cosineSim(a, b)))
}

export function buildPracticalOneHot(features) {
  const out = []
  for (const [key, slots] of Object.entries(PRACTICAL_FEATURE_SLOTS)) {
    const value = String(features?.[key])
    for (const slot of slots) out.push(value === slot ? 1 : 0)
  }
  return out
}

export function buildPlanFeatureVector(planVectorArr, practicalFeatures) {
  return [...planVectorArr, ...buildPracticalOneHot(practicalFeatures)]
}

export const THETA_LENGTH = ARCHETYPE_KEYS.length + Object.values(PRACTICAL_FEATURE_SLOTS).reduce((a, s) => a + s.length, 0)

export function sLearned(theta, x_p) {
  if (!theta || !theta.length) return 0.5 // sin aprendizaje todavía, neutro
  return sigmoid(dot(theta, x_p))
}

export function betaMean(likes, dislikes, alpha = BETA_PRIOR.alpha, beta = BETA_PRIOR.beta) {
  return (likes + alpha) / (likes + dislikes + alpha + beta)
}


export function sCollective({ signPlanStat, signTagStatsByArchetype, planVectorArr }) {
  const likes_sp = signPlanStat?.likes || 0
  const dislikes_sp = signPlanStat?.dislikes || 0
  const votos_p = likes_sp + dislikes_sp
  const lambda = Math.min(1, votos_p / 100)

  const betaMeanPlan = betaMean(likes_sp, dislikes_sp)

  let betaMeanTags = 0
  for (let i = 0; i < ARCHETYPE_KEYS.length; i++) {
    const weight = planVectorArr[i] || 0
    if (weight <= 0) continue
    const stat = signTagStatsByArchetype?.[ARCHETYPE_KEYS[i]]
    betaMeanTags += weight * betaMean(stat?.likes || 0, stat?.dislikes || 0)
  }

  return lambda * betaMeanPlan + (1 - lambda) * betaMeanTags
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function proximityScore(userLat, userLon, planLat, planLon) {
  if (userLat == null || userLon == null || planLat == null || planLon == null) return 0.5
  const distKm = haversineKm(userLat, userLon, planLat, planLon)
  return 1 - sigmoid((distKm - CONTEXT.proximityMidpointKm) * 0.8)
}

function timingScore(plan, now = new Date()) {
  if (!plan.event_date) return 0.7 
  const eventDate = new Date(plan.event_date)
  const diffDays = Math.floor((eventDate - now) / 86400000)
  if (diffDays === 0) return 1
  if (diffDays > 0 && diffDays <= 7) return 0.8
  if (diffDays < 0) return 0 
  return 0.5
}

export function sContext({ user, plan, now }) {
  const proximity = proximityScore(user.lat, user.lon, plan.lat, plan.lon)
  const timing = timingScore(plan, now)
  return (proximity + timing) / 2
}

export function scorePlan({ effVectorObj, planVectorArr, theta, nSwipes, signPlanStat, signTagStatsByArchetype, practicalFeatures, user, plan, now }) {
  const s_natal = sNatal(effVectorObj, planVectorArr)
  const x_p = buildPlanFeatureVector(planVectorArr, practicalFeatures)
  const s_learned = sLearned(theta, x_p)
  const s_collective = sCollective({ signPlanStat, signTagStatsByArchetype, planVectorArr })
  const s_context = sContext({ user, plan, now })

  const w2_eff = SCORE_WEIGHTS.w2 * Math.min(1, (nSwipes || 0) / COLD_START_N)
  const w1_eff = SCORE_WEIGHTS.w1 + (SCORE_WEIGHTS.w2 - w2_eff)

  const total =
    w1_eff * s_natal + w2_eff * s_learned + SCORE_WEIGHTS.w3 * s_collective + SCORE_WEIGHTS.w4 * s_context

  return { total, breakdown: { s_natal, s_learned, s_collective, s_context, w1_eff, w2_eff } }
}
