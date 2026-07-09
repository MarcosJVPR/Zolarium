import { supabase } from './supabase'
import { getUser, getInteractions } from './storage'
import { computeBaseVector, vectorToArray } from '../engine/archetype.js'

// Se ejecuta una sola vez, la primera vez que un usuario inicia sesión
// y todavía no tiene fila (o chart) en profiles. Sube lo que tuviera
// guardado en localStorage: carta astral + likes/dislikes.
// Es idempotente (upsert), así que si se llama dos veces no duplica nada.
export async function migrateLocalDataToSupabase(userId) {
  const localUser = getUser()
  const { liked, dislikes } = getInteractions()

  if (localUser?.birth && localUser?.chart) {
    const { vector, chartType } = computeBaseVector(localUser.chart)
    await supabase.from('profiles').upsert({
      id: userId,
      birth_date: localUser.birth.date,
      birth_time: localUser.birth.time || null,
      birth_place: localUser.birth.place || null,
      chart: localUser.chart,
      archetype_vector: vectorToArray(vector),
      chart_type: chartType,
      archetype_vector: vectorToArray(vector),
      chart_type: chartType,
    })
  }

  const sunSign = localUser?.chart?.sun || null
  const rows = []

  liked.forEach(planId =>
    rows.push({ user_id: userId, plan_id: planId, action: 'like', sign: sunSign })
  )
  Object.keys(dislikes).forEach(planId => {
    if (!liked.includes(planId)) {
      rows.push({ user_id: userId, plan_id: planId, action: 'dislike', sign: sunSign })
    }
  })

  if (rows.length) {
    await supabase.from('interactions').upsert(rows, { onConflict: 'user_id,plan_id' })
  }

  return localUser
}
