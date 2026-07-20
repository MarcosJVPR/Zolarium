import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SwipeCard from './SwipeCard'
import Mascot from './Mascot'
import { SIGNS } from '../utils/zodiac'
import { supabase } from '../utils/supabase'
import { fetchDeck, recordSwipe } from '../utils/api'

const MAX_GROUP = 4
const CORAL = '#FF7F50'
const MOOD_LABELS = {
  feliz: '✨ Radiante',
  neutral: '😌 En calma',
  come: '🍜 De antojos',
  duerme: '😴 Sin batería',
}

export default function PlanDeck({ sign, mode, onBack, onGoZoles, showBack = true }) {
  const [deck, setDeck] = useState(null)
  const [exitDir, setExitDir] = useState('like')
  const [members, setMembers] = useState(mode === 'cita' ? null : [])
  const [zoles, setZoles] = useState(null)
  const [picked, setPicked] = useState([])
  const [dragUp, setDragUp] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.rpc('get_zoles').then(({ data }) => setZoles(data || []))
  }, [])

  useEffect(() => {
    if (members === null) return
    setDeck(null)
    fetchDeck(sign, mode, members).then(setDeck).catch(() => setDeck([]))
  }, [sign, mode, members])

  const handleSwipe = action => {
    const current = deck[0]
    if (!current) return
    setExitDir(action)
    recordSwipe(current.id, action === 'like' ? 1 : 0)
    setDeck(d => d.slice(1))
  }

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 4000)
  }

  function handleDragY(offsetY) {
    setDragUp(prev => {
      const next = offsetY < -60
      return next === prev ? prev : next
    })
  }

  async function handleInviteDrop(px, py, plan) {
    const els = document.elementsFromPoint(px, py)
    let zolId = null
    for (const el of els) {
      const hit = el.closest?.('[data-zol-id]')
      if (hit) {
        zolId = hit.getAttribute('data-zol-id')
        break
      }
    }
    if (!zolId) return
    const zol = (zoles || []).find(f => f.id === zolId)
    if (!zol) return
    const name = zol.display_name || SIGNS[zol.sun]?.name || 'tu Zol'
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase.from('invites').insert({
      from_user: session.user.id,
      to_user: zol.id,
      plan_id: plan.id,
    })
    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        showToast(`Ya habías invitado a ${name} a este plan`)
      } else {
        showToast('No se pudo enviar la invitación')
      }
      return
    }
    showToast(`✨ Has invitado a ${name} a "${plan.title}"`)
  }

  function togglePick(f) {
    setPicked(p =>
      p.some(x => x.id === f.id)
        ? p.filter(x => x.id !== f.id)
        : p.length < MAX_GROUP ? [...p, f] : p
    )
  }

  function toggleMember(f) {
    setMembers(m =>
      m.some(x => x.id === f.id)
        ? m.filter(x => x.id !== f.id)
        : m.length < MAX_GROUP ? [...m, f] : m
    )
  }

  function openPicker() {
    setPicked(members || [])
    setMembers(null)
  }

  const isPareja = Array.isArray(members) && members.length === 1 && members[0]?.role === 'pareja'
  const canInvite = Array.isArray(zoles) && zoles.length > 0

  if (mode === 'cita' && members === null) {
    return (
      <div className="max-w-md mx-auto px-5 pt-6 pb-12">
        <button onClick={onBack} className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-center font-display mb-1">¿Con quién es el plan?</h2>
        <p className="text-center text-zolar-rose/70 text-sm mb-6">
          Elige tu pareja o varios Zoles. El cosmos mezclará vuestras cartas: entre amigos manda el ascendente, en pareja manda Venus.
        </p>

        {zoles === null ? (
          <p className="text-center text-zolar-rose/60">Buscando a tus Zoles...</p>
        ) : zoles.length === 0 ? (
          <div className="card-bento p-5 text-center mb-6" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,45,161,0.32), rgba(138,43,226,0.32))' }}>
            <p className="text-sm text-white/85 mb-3">Aún no tienes Zoles conectados.</p>
            <button onClick={onGoZoles} className="cta-zolar rounded-full px-5 py-2 text-sm font-semibold">
              Añadir amigos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {zoles.map(f => {
              const fs = SIGNS[f.sun] || SIGNS.aries
              const selected = picked.some(x => x.id === f.id)
              const pareja = f.role === 'pareja'
              const moodText = f.mood?.text || MOOD_LABELS[f.mood?.state || 'neutral']
              return (
                <button
                  key={f.id}
                  onClick={() => togglePick(f)}
                  className={`flex flex-col items-center p-2 rounded-3xl ${selected ? 'cta-zolar' : 'bubble-glass'}`}
                  style={pareja ? { boxShadow: `0 0 0 2px ${CORAL}, 0 6px 20px rgba(255,127,80,0.35)` } : undefined}
                >
                  <Mascot sign={f.sun || 'aries'} size={56} state={f.mood?.state || 'neutral'} />
                  <span className="text-xs font-semibold mt-1 truncate w-full text-center">
                    {pareja ? '💕 ' : ''}{f.display_name || fs.name}
                  </span>
                  <span className="text-[10px] text-white/70 truncate w-full text-center">
                    {moodText}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setMembers(picked)}
          disabled={picked.length === 0}
          className="w-full cta-zolar rounded-full py-3 font-bold mb-3 disabled:opacity-40"
        >
          {picked.length === 0
            ? 'Elige al menos un Zol'
            : picked.length === 1 && picked[0].role === 'pareja'
              ? '💕 Plan en pareja'
              : picked.length === 1
                ? '✨ Plan entre amigos (2)'
                : `✨ Plan en grupo (${picked.length + 1})`}
        </button>
        <button
          onClick={() => setMembers([])}
          className="w-full bubble-glass rounded-full py-3 text-sm text-white/85"
        >
          🌹 Modo cita clásico (sin conectar Zol)
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 h-[100dvh] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        {showBack ? (
          <button onClick={onBack} className="inline-flex items-center text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
            ← Volver
          </button>
        ) : (
          <div className="text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
            ✨ Para ti
          </div>
        )}
        {mode === 'cita' && isPareja && (
          <div className="rounded-full px-4 py-2 text-xs text-white font-semibold" style={{ background: `linear-gradient(135deg, ${CORAL}, #FF2DA1)` }}>
            💕 Con {members[0].display_name || SIGNS[members[0].sun]?.name || 'tu pareja'}
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 mb-2 px-1" style={{ scrollbarWidth: 'none' }}>
        <div className="shrink-0 w-16 flex flex-col items-center">
          <button
            onClick={() => {
              if (!zoles || zoles.length === 0) onGoZoles()
              else if (mode === 'cita') openPicker()
            }}
            aria-label="Añadir Zoles"
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white/70"
            style={{ border: '2px dashed rgba(255,255,255,0.35)' }}
          >
            +
          </button>
          <span className="text-[10px] text-white/60 mt-1">Añadir</span>
        </div>

        {(zoles || []).map(f => {
          const fs = SIGNS[f.sun] || SIGNS.aries
          const inPlan = Array.isArray(members) && members.some(x => x.id === f.id)
          const pareja = f.role === 'pareja'
          return (
            <div key={f.id} className="shrink-0 w-16 flex flex-col items-center">
              <button
                onClick={() => toggleMember(f)}
                data-zol-id={f.id}
                className={`rounded-full p-1 transition-all ${inPlan ? 'bubble-glass' : ''}`}
                style={{
                  ...(inPlan
                    ? { boxShadow: pareja ? `0 0 0 2.5px ${CORAL}, 0 6px 18px rgba(255,127,80,0.4)` : '0 0 0 2.5px #FF2DA1, 0 6px 18px rgba(255,45,161,0.35)' }
                    : dragUp
                      ? { opacity: 1, border: '2px dashed rgba(255,255,255,0.5)' }
                      : { opacity: 0.45, border: '2px dashed rgba(255,255,255,0.3)' }),
                  ...(dragUp
                    ? { transform: 'scale(1.12)', boxShadow: `0 0 0 2.5px #FF8A00, 0 0 22px rgba(255,138,0,0.6)` }
                    : {}),
                }}
              >
                <Mascot sign={f.sun || 'aries'} size={48} state={f.mood?.state || 'neutral'} />
              </button>
              <span className="text-[10px] text-white/75 mt-1 truncate w-full text-center">
                {pareja ? '💕' : ''}{f.display_name || fs.name}
              </span>
            </div>
          )
        })}

        {zoles !== null && zoles.length === 0 && (
          <>
            <div className="shrink-0 w-14 h-14 rounded-full" style={{ border: '2px dashed rgba(255,255,255,0.15)' }} />
            <div className="shrink-0 w-14 h-14 rounded-full" style={{ border: '2px dashed rgba(255,255,255,0.15)' }} />
          </>
        )}
      </div>

      <div className="relative flex-1 mb-6">
        {deck === null && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="text-5xl animate-pulse">✨</div>
            <p className="text-zolar-rose/70">Consultando el cosmos...</p>
          </div>
        )}

        <AnimatePresence custom={exitDir}>
          {deck && deck.length > 0 && (
            <SwipeCard
              key={deck[0].id}
              plan={deck[0]}
              sign={sign}
              onSwipe={handleSwipe}
              canInvite={canInvite}
              onDragY={handleDragY}
              onInviteDrop={handleInviteDrop}
            />
          )}
        </AnimatePresence>

        {deck && deck.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="text-5xl">🌙</div>
            <p className="text-zolar-rose/70">
              El cosmos no tiene más planes por ahora.
              <br />Vuelve pronto.
            </p>
          </div>
        )}
      </div>

      {deck && deck.length > 0 && (
        <div className={`flex justify-center gap-8 ${showBack ? 'pb-8' : 'pb-24'}`}>
          <button
            onClick={() => handleSwipe('dislike')}
            className="w-16 h-16 rounded-full bubble-glass text-2xl"
            style={{ border: '1px solid rgba(255,45,161,0.5)' }}
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 rounded-full text-2xl cta-zolar"
          >
            ❤
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed left-1/2 -translate-x-1/2 bubble-glass rounded-full px-5 py-3 text-sm text-white z-50 max-w-[90vw] text-center"
            style={{ background: 'rgba(28,20,32,0.95)', bottom: 'calc(env(safe-area-inset-bottom) + 96px)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
