import { useState, useEffect } from 'react'
import { fetchSaved } from '../utils/api'
import { unlikePlan } from '../utils/storage'

export default function Saved({ onBack }) {
  const [plans, setPlans] = useState(null)

  useEffect(() => {
    fetchSaved().then(setPlans).catch(() => setPlans([]))
  }, [])

  const remove = id => {
    unlikePlan(id)
    setPlans(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-12">
      <button onClick={onBack} className="inline-flex items-center self-start mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 font-display">Mis planes guardados</h2>

      {plans === null && <p className="text-zolar-rose/60">Cargando...</p>}

      {plans && plans.length === 0 && (
        <p className="text-zolar-rose/60">Aún no has guardado ningún plan. Haz swipe a la derecha ❤</p>
      )}

      <div className="flex flex-col gap-3">
        {(plans || []).map(p => (
          <div key={p.id} className="card-zolar rounded-2xl p-4 flex gap-4 items-center">
            <div className="text-3xl">{p.emoji}</div>
            <div className="flex-1">
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-zolar-rose/60">
                📍 {p.neighborhood || p.address || 'Madrid'}
                {p.event_date && ` · 📅 ${p.event_date.slice(8, 10)}/${p.event_date.slice(5, 7)}`}
              </p>
            </div>
            <button onClick={() => remove(p.id)} className="text-zolar-rose/50">✕</button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-zolar-rose/40 mt-8 text-center">
        Datos: Ayuntamiento de Madrid (datos.madrid.es) · CC BY 4.0
      </p>
    </div>
  )
}
