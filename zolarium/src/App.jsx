import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import Onboarding from './components/Onboarding'
import Menu from './components/Menu'
import PlanDeck from './components/PlanDeck'
import Saved from './components/Saved'
import ZodiacGarden from './components/ZodiacGarden'
import MapView from './components/MapView'
import Zoles from './components/Zoles'
import Astro from './components/Astro'
import AstroFeed from './components/AstroFeed'
import BottomNav from './components/BottomNav'
import ZolariumZ from './components/ZolariumZ'
import StarField from './components/StarField'
import { supabase } from './utils/supabase'
import { migrateLocalDataToSupabase } from './utils/migrateLocalData'
import { computeBaseVector, vectorToArray } from './engine/archetype.js'
import { SIGNS } from './utils/zodiac'

const NAV_VIEWS = ['planes', 'mapa', 'feed', 'zoles', 'menu']
const PADDED_VIEWS = ['feed', 'zoles', 'menu']

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
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2"
    >
      ← Volver
    </button>
  )
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
  const [profile, setProfile] = useState(undefined)
  const [view, setView] = useState('planes')
  const [mapCat, setMapCat] = useState('todos')
  const [editing, setEditing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    const m = window.location.pathname.match(/^\/invite\/([A-Za-z0-9]{4,10})/)
    if (m) {
      localStorage.setItem('zolar_invite', m[1].toUpperCase())
      window.history.replaceState(null, '', '/')
    }
  }, [])

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

  useEffect(() => {
    const pending = localStorage.getItem('zolar_invite')
    if (!pending || !session || !profile?.chart) return
    supabase
      .rpc('add_friend_by_code', { p_code: pending })
      .then(() => setView('zoles'))
      .finally(() => localStorage.removeItem('zolar_invite'))
  }, [session, profile])

  useEffect(() => {
    if (view === 'carta' && profile?.chart && !profile.ai_reading && !aiLoading && !aiError) {
      handleAiReading()
    }
  }, [view, profile])

  async function handleAiReading() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const raw = await res.text()
      let data = null
      try {
        data = JSON.parse(raw)
      } catch {
        data = null
      }
      if (!res.ok || !data?.reading) {
        const detail = data?.error
          ? data.error
          : window.location.hostname === 'localhost' || window.location.hostname.includes('github')
            ? 'Las funciones /api solo existen en Vercel: prueba la lectura en zolarium.vercel.app'
            : `El servidor de lectura falló (HTTP ${res.status}). Revisa GEMINI_API_KEY en Vercel.`
        throw new Error(detail)
      }
      setProfile(prev => ({ ...prev, ai_reading: data.reading }))
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

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
            ai_reading: null,
            ai_reading_at: null,
          }
          await supabase.from('profiles').upsert(row)
          setAiError(null)
          setProfile(prev => ({ ...(prev || {}), ...row }))
          setEditing(false)
          setView('planes')
        }}
      />
    )

  let screen = null

  if (view === 'planes' || view === 'diferentes' || view === 'cita') {
    screen = (
      <PlanDeck
        sign={user.chart.sun}
        mode={view}
        showBack={view !== 'planes'}
        onBack={() => setView('menu')}
        onGoZoles={() => setView('zoles')}
      />
    )
  } else if (view === 'guardados') {
    screen = <Saved onBack={() => setView('menu')} />
  } else if (view === 'garden') {
    screen = <ZodiacGarden sign={user.chart.sun} onBack={() => setView('menu')} />
  } else if (view === 'zoles') {
    screen = <Zoles user={user} onBack={() => setView('menu')} />
  } else if (view === 'astro') {
    screen = <Astro onBack={() => setView('menu')} />
  } else if (view === 'feed') {
    screen = (
      <AstroFeed
        user={user}
        onBack={() => setView('menu')}
        onGarden={() => setView('garden')}
        onAstro={() => setView('astro')}
      />
    )
  } else if (view === 'mapa') {
    screen = (
      <MapView
        sign={user.chart.sun}
        initialCat={mapCat}
        onBack={() => {
          setMapCat('todos')
          setView('menu')
        }}
      />
    )
  } else if (view === 'perfil') {
    const sign = SIGNS[user.chart.sun]
    screen = (
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
          className="w-full rounded-full py-3 font-bold text-white mb-3 cta-zolar"
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
  } else if (view === 'carta') {
    screen = (
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
            <div className="card-zolar rounded-2xl p-4 text-center text-sm text-zolar-rose/80">
              {aiLoading ? '✨ Consultando las estrellas para tu lectura...' : 'Tu lectura se generará automáticamente.'}
            </div>
          )}
          {aiError && (
            <button
              onClick={handleAiReading}
              className="w-full mt-3 rounded-xl p-3 text-center font-semibold cta-zolar"
            >
              Reintentar lectura
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
  } else {
    screen = <Menu user={user} onSelect={setView} />
  }

  const withNav = NAV_VIEWS.includes(view)

  return (
    <>
      {withNav && PADDED_VIEWS.includes(view) ? <div className="pb-24">{screen}</div> : screen}
      {withNav && <BottomNav active={view} onSelect={setView} />}
    </>
  )
}

export default function App() {
  return (
    <>
      <StarField />
      <AppScreens />
    </>
  )
}
