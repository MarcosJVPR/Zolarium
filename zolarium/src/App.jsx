import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import Onboarding from './components/Onboarding'
import Menu from './components/Menu'
import PlanDeck from './components/PlanDeck'
import Saved from './components/Saved'
import ZodiacGarden from './components/ZodiacGarden'
import MapView from './components/MapView'
import ZolariumZ from './components/ZolariumZ'
import StarField from './components/StarField'
import { supabase } from './utils/supabase'
import { migrateLocalDataToSupabase } from './utils/migrateLocalData'
import { computeBaseVector, vectorToArray } from './engine/archetype.js'
import { SIGNS } from './utils/zodiac'

const PLANETS = [
  ['sun', '☀️ Sol', 'Tu identidad'],
  ['moon', '🌙 Luna', 'Tus emociones'],
  ['ascendant', '🌅 Ascendente', 'Cómo te ven'],
  ['venus', '💘 Venus', 'Tu forma de amar'],
  ['mars', '🔥 Marte', 'Tu energía'],
  ['mercury', '💬 Mercurio', 'Tu mente'],
  ['jupiter', '🍀 Júpiter', 'Tu expansión'],
  ['saturn', '⛰️ Saturno', 'Tu disciplina'],
]

function Back({ onClick }) {
  return <button onClick={onClick} className="text-zolar-rose/70 mb-4">← Volver</button>
}

function profileToUser(row) {
  if (!row?.chart) return null
  return {
    birth: { date: row.birth_date, time: row.birth_time, place: row.birth_place },
    chart: row.chart,
  }
}

function AppScreens() {
  const { session, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = cargando, null = no existe aún
  const [view, setView] = useState('menu')
  const [editing, setEditing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    if (!session) {
      setProfile(undefined)
      return
    }
    let active = true

    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!active) return

      if (data?.chart) {
        setProfile(data)
        return
      }

      const localUser = await migrateLocalDataToSupabase(session.user.id)
      if (!active) return

      if (localUser?.chart) {
        const { data: fresh } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        setProfile(fresh || null)
      } else {
        setProfile(null)
      }
    }

    loadProfile()
    return () => { active = false }
  }, [session])

  if (authLoading) return null
  if (!session) return <AuthScreen />
  if (profile === undefined) return null

  const user = profileToUser(profile)

  if (!user || editing)
    return (
      <Onboarding
        onComplete={async u => {
          const { vector, chartType } = computeBaseVector(u.chart)
          const row = {
            id: session.user.id,
            birth_date: u.birth.date,
            birth_time: u.birth.time || null,
            birth_place: u.birth.place || null,
            chart: u.chart,
            archetype_vector: vectorToArray(vector),
            chart_type: chartType,
            archetype_vector: vectorToArray(vector),
            chart_type: chartType,
          }
          await supabase.from('profiles').upsert(row)
          setProfile(row)
          setEditing(false)
          setView('menu')
        }}
      />
    )

  if (view === 'planes' || view === 'diferentes' || view === 'cita' || view === 'solitario')
    return <PlanDeck sign={user.chart.sun} mode={view} onBack={() => setView('menu')} />

  if (view === 'guardados') return <Saved onBack={() => setView('menu')} />
  if (view === 'garden') return <ZodiacGarden sign={user.chart.sun} onBack={() => setView('menu')} />
  if (view === 'mapa') return <MapView onBack={() => setView('menu')} />

  if (view === 'astro') {
    return (
      <div className="max-w-md mx-auto px-6 pt-8 pb-12">
        <Back onClick={() => setView('menu')} />
        <h2 className="text-2xl font-bold mb-2 text-center font-display">Astro</h2>
        <p className="text-center text-zolar-rose/70 mb-8">Tarot, astrólogos y guías espirituales</p>

        <div className="flex flex-col gap-4">
          <div className="card-zolar rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🃏</div>
            <h3 className="font-bold mb-1">Lectores de tarot</h3>
            <p className="text-sm text-zolar-rose/70">Próximamente: sesiones con tarotistas verificados.</p>
          </div>
          <div className="card-zolar rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🔭</div>
            <h3 className="font-bold mb-1">Astrólogos</h3>
            <p className="text-sm text-zolar-rose/70">Próximamente: consultas de carta natal en profundidad.</p>
          </div>
          <div className="card-zolar rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="font-bold mb-1">Lectura astral con IA</h3>
            <p className="text-sm text-zolar-rose/70">Próximamente: tu carta interpretada al instante.</p>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'perfil') {
    const sign = SIGNS[user.chart.sun]
    return (
      <div className="max-w-md mx-auto px-6 pt-8 pb-12">
        <Back onClick={() => setView('menu')} />
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{sign.symbol}</div>
          <h2 className="text-2xl font-bold font-display">Mi perfil</h2>
        </div>

        <div className="card-zolar rounded-2xl p-5 flex flex-col gap-3 text-sm mb-6">
          <p><span className="text-zolar-rose/60">Fecha de nacimiento:</span> {user.birth.date}</p>
          <p><span className="text-zolar-rose/60">Hora:</span> {user.birth.time || 'No indicada'}</p>
          <p><span className="text-zolar-rose/60">Lugar:</span> {user.birth.place || 'No indicado'}</p>
          <p><span className="text-zolar-rose/60">Signo solar:</span> {sign.name}</p>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-full py-3 font-bold text-white mb-3"
          style={{ background: 'linear-gradient(90deg, #F4913F, #9D7295)' }}
        >
          Editar mis datos de nacimiento
        </button>
        <p className="text-xs text-center text-zolar-rose/50 mb-8">
          Tus planes guardados no se pierden al editar.
        </p>

        <button
          onClick={signOut}
          className="w-full text-sm text-zolar-rose/50 underline"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (view === 'carta') {
    return (
      <div className="max-w-md mx-auto px-6 pt-8 pb-12">
        <Back onClick={() => setView('menu')} />
        <div className="flex justify-center mb-6">
          <ZolariumZ sign={user.chart.sun} size={60} withWordmark />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center font-display">Tu carta astral</h2>

        <div className="flex flex-col gap-3">
          {PLANETS.map(([key, label, desc]) => {
            const signKey = user.chart[key]
            if (!signKey) return null
            const sign = SIGNS[signKey]
            return (
              <div
                key={key}
                className="card-zolar rounded-2xl p-4 flex items-center gap-4"
                style={{ borderLeft: `4px solid ${sign.color}` }}
              >
                <span className="w-28 shrink-0 text-sm font-semibold">{label}</span>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: sign.soft }}>
                    {sign.symbol} {sign.name}
                  </p>
                  <p className="text-xs text-zolar-rose/70">{desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          {profile.ai_reading ? (
            <div className="card-zolar rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line">
              {profile.ai_reading}
            </div>
          ) : (
            <button
              onClick={handleAiReading}
              disabled={aiLoading}
              className="w-full rounded-xl p-3 text-center font-semibold"
              style={{ background: 'linear-gradient(135deg, #F4913F, #9D7295)' }}
            >
              {aiLoading ? 'Consultando las estrellas...' : '✨ Leer mi carta con IA'}
            </button>
          )}
          {aiError && <p className="text-sm text-red-400 mt-2 text-center">{aiError}</p>}
        </div>
        {!user.chart.moon && (
          <p className="text-sm text-zolar-rose/60 mt-6 text-center">
            Añade hora y lugar de nacimiento para desbloquear tu carta completa.
          </p>
        )}
      </div>
    )
  }

  async function handleAiReading() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando la lectura')
      setProfile(prev => ({ ...prev, ai_reading: data.reading }))
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  return <Menu user={user} onSelect={setView} />
}

export default function App() {
  return (
    <>
      <StarField />
      <AppScreens />
    </>
  )
}
