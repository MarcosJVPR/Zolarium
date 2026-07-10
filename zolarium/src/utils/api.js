import { supabase } from './supabase'
import { computeBaseVector, arrayToVector, normalize } from '../engine/archetype.js'
import { effectiveVector } from '../engine/ageModulator.js'
import { scorePlan } from '../engine/scoring.js'
import { buildDeck } from '../engine/deck.js'
import { ARCHETYPE_KEYS, DECK, W_POINT_CITA, W_POINT_SOLITARIO } from '../engine/config.js'


const DEFAULT_LOCATION = { lat: 40.4168, lon: -3.7038 }

async function loadUserContext() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sin sesión activa')
  const uid = session.user.id

  const [profileRes, weightsRes, interactionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('user_weights').select('theta, n_swipes').eq('user_id', uid).maybeSingle(),
    supabase.from('interactions').select('plan_id, action').eq('user_id', uid),
  ])

  return {
    uid,
    profile: profileRes.data,
    weights: weightsRes.data,
    interactions: interactionsRes.data || [],
  }
}

function invertVector(vectorObj) {

  const max = Math.max(...ARCHETYPE_KEYS.map(k => vectorObj[k] || 0))
  const inverted = {}
  for (const k of ARCHETYPE_KEYS) inverted[k] = max - (vectorObj[k] || 0) + 0.01
  return normalize(inverted)
}

export async function fetchDeck(_sign, mode = 'planes') {
  const { profile, weights, interactions } = await loadUserContext()
  if (!profile?.chart) throw new Error('Perfil sin carta astral')


  const modeWeights = mode === 'cita' ? W_POINT_CITA : mode === 'solitario' ? W_POINT_SOLITARIO : null
  const baseVector = (profile.archetype_vector?.length && !modeWeights)
    ? arrayToVector(profile.archetype_vector)
    : computeBaseVector(profile.chart, modeWeights).vector

  let effVector = effectiveVector(baseVector, profile.chart, profile.birth_date)
  if (mode === 'diferentes') effVector = invertVector(effVector)

  const sign = profile.chart.sun
  const today = new Date().toISOString().slice(0, 10)
  const swiped = new Set(interactions.map(i => i.plan_id))

  const [eventsRes, placesRes] = await Promise.all([
    supabase.from('plans').select('*')
      .not('archetype_vector', 'is', null)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(250),
    supabase.from('plans').select('*')
      .not('archetype_vector', 'is', null)
      .is('event_date', null)
      .limit(250),
  ])

  const candidates = [...(eventsRes.data || []), ...(placesRes.data || [])]
    .filter(p => !swiped.has(p.id))

  if (!candidates.length) return []

  const candidateIds = candidates.map(p => p.id)
  const [planStatsRes, tagStatsRes] = await Promise.all([
    supabase.from('plan_sign_stats').select('*')
      .eq('sign', sign)
      .in('plan_id', candidateIds),
    supabase.from('sign_tag_stats').select('*').eq('sign', sign),
  ])

  const planStatsById = {}
  for (const row of planStatsRes.data || []) planStatsById[row.plan_id] = row
  const tagStatsByArchetype = {}
  for (const row of tagStatsRes.data || []) tagStatsByArchetype[row.tag] = row

  const user = { ...DEFAULT_LOCATION }
  const now = new Date()
  const theta = weights?.theta?.length ? weights.theta : null
  const nSwipes = weights?.n_swipes || 0

  const scored = candidates.map(plan => {
    const planVectorArr = plan.archetype_vector
    const score = scorePlan({
      effVectorObj: effVector,
      planVectorArr,
      theta,
      nSwipes,
      signPlanStat: planStatsById[plan.id],
      signTagStatsByArchetype: tagStatsByArchetype,
      practicalFeatures: plan,
      user,
      plan,
      now,
    })
    return { plan, planVectorArr, score }
  })

  const deck = buildDeck(scored, effVector, { size: DECK.size })
  return deck.map(plan => {
    const stat = planStatsById[plan.id]
    const total = (stat?.likes || 0) + (stat?.dislikes || 0)
    const pct = total > 0 ? Math.round((stat.likes / total) * 100) : 0
    return { ...plan, votes_total: total, votes_pct: pct }
  })
}

export async function fetchSaved() {
  const { interactions } = await loadUserContext()
  const liked = interactions.filter(i => i.action === 'like').map(i => i.plan_id)
  if (!liked.length) return []
  const { data } = await supabase.from('plans').select('*').in('id', liked)
  return data || []
}

export async function recordSwipe(planId, direction) {
  const { error } = await supabase.rpc('record_swipe', {
    p_plan_id: planId,
    p_direction: direction,
  })
  if (error) console.error('record_swipe:', error.message)
  return !error
}
